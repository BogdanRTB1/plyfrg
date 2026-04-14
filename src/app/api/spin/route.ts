import { NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Server-Side Slot RNG API
 * 
 * Receives a SlotConfig + bet amount, generates cryptographically random
 * reel positions, evaluates paylines, and returns the result.
 * The client NEVER determines win/loss — only animates the pre-decided result.
 */

interface SlotSymbol {
  id: string;
  name: string;
  type: 'normal' | 'wild' | 'scatter';
  payouts: { 3?: number; 4?: number; 5?: number };
}

interface SpinRequest {
  config: {
    rows: number;
    cols: number;
    symbols: SlotSymbol[];
    volatility: 'low' | 'medium' | 'high';
    features: {
      wildEnabled: boolean;
      wildSymbolId?: string;
      scatterEnabled: boolean;
      scatterSymbolId?: string;
      freeSpinsCount: number;
      progressiveMultiplier: boolean;
    };
  };
  bet: number;
}

function cryptoRandom(): number {
  // Generate a cryptographically secure random number between 0 and 1
  const bytes = crypto.randomBytes(4);
  return bytes.readUInt32BE(0) / 0xFFFFFFFF;
}

function cryptoRandomInt(max: number): number {
  return Math.floor(cryptoRandom() * max);
}

/**
 * Generate the reel grid using weighted randomness based on volatility.
 * Lower value symbols appear more frequently.
 */
function generateGrid(rows: number, cols: number, symbols: SlotSymbol[], volatility: string): number[][] {
  const grid: number[][] = [];
  
  // Build weight table: higher-index symbols (rarer, higher payout) have lower weight
  const weights = symbols.map((sym, i) => {
    let base = symbols.length - i; // reverse index = rarer symbols less frequent
    
    // Wilds and scatters are rarer
    if (sym.type === 'wild') base = Math.max(1, Math.floor(base * 0.4));
    if (sym.type === 'scatter') base = Math.max(1, Math.floor(base * 0.5));
    
    // Adjust by volatility
    if (volatility === 'low') {
      // More even distribution — more frequent small wins
      base = Math.max(2, Math.ceil(base * 1.2));
    } else if (volatility === 'high') {
      // Steeper curve — common symbols dominate, rares are very rare
      base = Math.max(1, Math.floor(base * (i < symbols.length / 2 ? 1.5 : 0.6)));
    }
    
    return base;
  });
  
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  
  function pickSymbol(): number {
    let roll = cryptoRandom() * totalWeight;
    for (let i = 0; i < weights.length; i++) {
      roll -= weights[i];
      if (roll <= 0) return i;
    }
    return 0;
  }
  
  for (let r = 0; r < rows; r++) {
    const row: number[] = [];
    for (let c = 0; c < cols; c++) {
      row.push(pickSymbol());
    }
    grid.push(row);
  }
  
  return grid;
}

/**
 * Evaluate wins on the grid.
 * Uses simple left-to-right consecutive matching per row (payline),
 * with Wild substitution support.
 * 
 * For 3x3 grids: all 3 rows are paylines + diagonals
 * For 5x3 grids: all 3 rows are paylines
 * For 6x5 grids: all 5 rows are paylines
 */
function evaluateWins(
  grid: number[][],
  symbols: SlotSymbol[],
  wildEnabled: boolean,
  wildSymbolId?: string
): { totalMultiplier: number; winningCells: [number, number][] } {
  
  const rows = grid.length;
  const cols = grid[0].length;
  let totalMultiplier = 0;
  const winningCellSet = new Set<string>();
  
  const wildIndex = wildEnabled && wildSymbolId
    ? symbols.findIndex(s => s.id === wildSymbolId)
    : -1;
  
  function isWild(symIdx: number): boolean {
    return wildIndex >= 0 && symIdx === wildIndex;
  }
  
  function matchesOrWild(symIdx: number, targetIdx: number): boolean {
    return symIdx === targetIdx || isWild(symIdx) || isWild(targetIdx);
  }
  
  // Define paylines
  const paylines: number[][] = [];
  
  // All horizontal rows
  for (let r = 0; r < rows; r++) {
    paylines.push(Array.from({ length: cols }, () => r));
  }
  
  // Add diagonals for 3x3 and 5x3
  if (rows === 3 && cols <= 5) {
    // Top-left to bottom-right diagonal
    if (cols === 3) {
      paylines.push([0, 1, 2]); // diagonal down
      paylines.push([2, 1, 0]); // diagonal up
    } else if (cols === 5) {
      paylines.push([0, 1, 2, 1, 0]); // V-shape
      paylines.push([2, 1, 0, 1, 2]); // inverse V
    }
  }
  
  // Evaluate each payline
  for (const payline of paylines) {
    // Get the symbols on this payline
    const lineSymbols: number[] = payline.map((row, col) => grid[row][col]);
    
    // Find the first non-wild symbol
    let baseSymIdx = -1;
    for (const symIdx of lineSymbols) {
      if (!isWild(symIdx)) { baseSymIdx = symIdx; break; }
    }
    if (baseSymIdx === -1 && lineSymbols.length > 0) {
      // All wilds — use wild symbol itself
      baseSymIdx = wildIndex;
    }
    if (baseSymIdx === -1) continue;
    
    // Count consecutive matches from left
    let matchCount = 0;
    const matchedPositions: [number, number][] = [];
    
    for (let c = 0; c < cols; c++) {
      const symIdx = lineSymbols[c];
      if (symIdx === baseSymIdx || isWild(symIdx)) {
        matchCount++;
        matchedPositions.push([payline[c], c]);
      } else {
        break;
      }
    }
    
    // Check payout
    const sym = symbols[baseSymIdx];
    if (!sym) continue;
    
    let mul = 0;
    if (matchCount >= 5 && sym.payouts[5]) mul = sym.payouts[5];
    else if (matchCount >= 4 && sym.payouts[4]) mul = sym.payouts[4];
    else if (matchCount >= 3 && sym.payouts[3]) mul = sym.payouts[3];
    
    if (mul > 0) {
      totalMultiplier += mul;
      matchedPositions.forEach(([r, c]) => winningCellSet.add(`${r},${c}`));
    }
  }
  
  const winningCells: [number, number][] = Array.from(winningCellSet).map(s => {
    const [r, c] = s.split(',').map(Number);
    return [r, c];
  });
  
  return { totalMultiplier, winningCells };
}

/**
 * Count scatter symbols on the entire grid
 */
function countScatters(grid: number[][], symbols: SlotSymbol[], scatterSymbolId?: string): number {
  if (!scatterSymbolId) return 0;
  const scatterIdx = symbols.findIndex(s => s.id === scatterSymbolId);
  if (scatterIdx === -1) return 0;
  
  let count = 0;
  for (const row of grid) {
    for (const cell of row) {
      if (cell === scatterIdx) count++;
    }
  }
  return count;
}

export async function POST(req: Request) {
  try {
    const body: SpinRequest = await req.json();
    const { config, bet } = body;
    
    if (!config || !config.symbols || config.symbols.length === 0) {
      return NextResponse.json({ error: 'Invalid config' }, { status: 400 });
    }
    if (!bet || bet <= 0) {
      return NextResponse.json({ error: 'Invalid bet amount' }, { status: 400 });
    }
    
    const rows = config.rows || 3;
    const cols = config.cols || 5;
    const volatility = config.volatility || 'medium';
    
    // Generate the grid
    const grid = generateGrid(rows, cols, config.symbols, volatility);
    
    // Evaluate wins
    const { totalMultiplier, winningCells } = evaluateWins(
      grid,
      config.symbols,
      config.features?.wildEnabled ?? false,
      config.features?.wildSymbolId
    );
    
    // Check for scatter-triggered free spins
    let freeSpinsAwarded = 0;
    if (config.features?.scatterEnabled && config.features?.scatterSymbolId) {
      const scatterCount = countScatters(grid, config.symbols, config.features.scatterSymbolId);
      if (scatterCount >= 3) {
        freeSpinsAwarded = config.features.freeSpinsCount || 10;
      }
    }
    
    const result = {
      grid,
      win: totalMultiplier > 0,
      multiplier: totalMultiplier,
      winningCells,
      freeSpinsAwarded,
    };
    
    return NextResponse.json(result);
    
  } catch (error: any) {
    console.error('Spin API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
