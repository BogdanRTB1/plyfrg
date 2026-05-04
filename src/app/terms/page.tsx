import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
    return (
        <div className="flex-1 h-full overflow-y-auto custom-scrollbar bg-[#050505]">
            <div className="max-w-4xl mx-auto p-6 md:p-12 pb-32">
                <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 text-sm font-medium">
                    <ArrowLeft size={16} />
                    Back to Home
                </Link>

                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-8">Terms & Conditions</h1>

                <div className="prose prose-invert prose-slate max-w-none text-slate-300">
                    <div className="p-6 md:p-10 bg-[#0f212e] rounded-3xl border border-white/5 space-y-8 shadow-xl">
                        
                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">1. INTRODUCTION</h2>
                            <p className="leading-relaxed mb-4">
                                Welcome to Playforges.us ! Before the fun starts, we need to make sure you know how we operate and what it means when you register an account.
                            </p>
                            <p className="leading-relaxed mb-4">
                                <strong>Who are we:</strong> The Platform is provided by Playforges Limited, a company duly incorporated under Cyprus law, with the register number HE436256 and registered office at 54-56 Riga Feraiou, Lizantia Court, Office 310, Agioi Omologites, 1087 Nicosia, Cyprus (hereinafter “Playforges”, “we” , “us” or “our”).
                            </p>
                            <p className="leading-relaxed mb-4">
                                <strong>Registering on the Platform:</strong> By registering on the Platform (through any electronic device, such as the web, mobile, tablet or any other device), you accept these Terms and Conditions (“Terms”) and enter into a binding agreement with us which applies to your access to, and use of, our Platform and our Games. PLEASE TAKE THE TIME TO READ THESE TERMS CAREFULLY AND IN THEIR ENTIRETY. BY ACCEPTING THESE TERMS, YOU REPRESENT – AND WE ARE RELYING ON YOUR REPRESENTATION – THAT YOU HAVE DONE SO. IF YOU LIVE IN ANY OF THE EXCLUDED TERRITORIES IDENTIFIED BELOW, DO NOT PROCEED ANY FURTHER AS YOU ARE NOT ELIGIBLE TO ACCESS OR USE THE PLATFORM, CREATE A CUSTOMER ACCOUNT, PLAY THE GAMES OR INTERACT WITH PLAYFORGES IN ANY OTHER WAY.
                            </p>
                            <p className="leading-relaxed mb-4">
                                By checking the box for acceptance during the registration process, accessing or using our Platform, creating a Customer Account, and/or accessing the Games, you confirm that you have read and agree to be bound by these Terms, which includes our Privacy Policy and other game-specific or promotion-specific terms relevant to your Participation. If you do not agree with any provision of these Terms or any other linked policy, rules or terms, you may not access or use the Platform, create a Customer Account or play any Game. We may update these Terms periodically at our discretion. By continuing to access our Platform, your Customer Account, and/or our Games you are deemed to have read and to be bound by any such updates. If you do not wish to be bound by these Terms, any updated Terms or any other linked policy, rules or terms, you may not continue to access the Platform or any of the Games (including the website and any associated apps). We will note the most recent date of these Terms at the top of this page.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">2. PLAYFORGES STATEMENT</h2>
                            <p className="leading-relaxed mb-4">
                                2.1. The following are "Excluded Territories”: 
                                <br />a) Any country other than the continental United States of America and Hawaii (“US”); 
                                <br />b) Within the US the following States are excluded: i. WASHINGTON ii. NEW YORK iii. NEVADA iv. IDAHO v. KENTUCKY vi. MICHIGAN vii. VERMONT viii. NEW JERSEY ix. DELAWARE x. WEST VIRGINIA xi. PENNSYLVANIA xii. RHODE ISLAND xiii. CONNECTICUT xiv. MARYLAND xv. LOUISIANA xvi. MONTANA xvii. ARIZONA xviii. TENNESSEE xix. CALIFORNIA xx. Any other states or jurisdictions which, under the laws applicable to you, are legally precluded from playing the Games offered on the Platform, and any other jurisdiction Playforges excludes, in its sole discretion, from time to time.
                            </p>
                            <p className="leading-relaxed mb-4">
                                2.2. BY ACCEPTING THESE TERMS, ACCESSING OR USING THE PLATFORM, CREATING A CUSTOMER ACCOUNT, AND/OR PLAYING THE GAMES, YOU SPECIFICALLY REPRESENT TO US THAT YOU DO NOT LIVE IN ANY OF THE EXCLUDED TERRITORIES. WE ARE SPECIFICALLY RELYING ON SUCH REPRESENTATIONS IN PROVIDING YOU ACCESS TO THE PLATFORM, CUSTOMER ACCOUNT, AND GAMES. IF YOU RESIDE IN ANY OF THE EXCLUDED TERRITORIES AND NONETHELESS CHECK THE BOX FOR ACCEPTANCE OF THESE TERMS, ACCESS OR USE THE PLATFORM, CREATE A CUSTOMER ACCOUNT, AND/OR PLAY THE GAMES DESPITE OUR EFFORTS TO PREVENT YOU FROM DOING SO, WE CONSIDER YOUR ACTIONS TO BE A MATERIAL MISREPRESENTATION TO US, A FRAUDULENT INDUCEMENT OF OUR SERVICES, AND A VIOLATION OF THESE TERMS, AND WE RESERVE ALL RIGHTS TO TAKE APPROPRIATE ACTION AGAINST YOU.
                            </p>
                            <p className="leading-relaxed mb-4">
                                2.3. NO PURCHASE OR PAYMENT IS NECESSARY TO PARTICIPATE OR PLAY THE GAMES. A PURCHASE OR PAYMENT OF ANY KIND WILL NOT INCREASE YOUR CHANCES OF WINNING.
                                <br />2.4. THE PLATFORM AND GAMES DO NOT OFFER REAL MONEY GAMBLING, AND NO ACTUAL MONEY IS REQUIRED TO PLAY.
                                <br />2.5. ONLY CUSTOMERS IN THE CONTINENTAL UNITED STATES AND HAWAII (EXCEPT FOR THE EXCLUDED TERRITORIES) ARE ELIGIBLE TO ACCESS AND USE THE PLATFORM, CREATE A CUSTOMER ACCOUNT, AND PLAY THE GAMES.
                                <br />2.6. PLEASE BE AWARE THAT THESE TERMS INCLUDE DISPUTE RESOLUTION PROVISIONS, INCLUDING A PROVISION WAIVING YOUR RIGHT TO PURSUE ANY CLASS, GROUP OR REPRESENTATIVE CLAIM AND REQUIRING YOU TO PURSUE PAST, PENDING, AND FUTURE DISPUTES BETWEEN YOU AND US THROUGH INDIVIDUAL ARBITRATION UNLESS YOU OPT OUT WITHIN THE SPECIFIED TIME FRAME PURSUANT TO CLAUSE 26.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">3. DEFINITIONS</h2>
                            <ul className="list-disc pl-5 space-y-2 leading-relaxed">
                                <li>a) “Collective Action”– means any claim, action, or proceeding asserted or pursued as a class action, group action, collective action, joint action, coordinated action, consolidated action, mass action, or in any other representative or private attorney general capacity, whether in arbitration, court or any other venue.</li>
                                <li>b) “Content”– means text, graphics, user interfaces, visual interfaces, photographs, trademarks, logos, sounds, music, artwork, computer code and other material used, displayed or available as part of the Games and Platform.</li>
                                <li>c) “Customer Account”– means an account held by a Registered Customer.</li>
                                <li>d) “Fraudulent Conduct" – means any of the conduct described in clause 16.</li>
                                <li>e) “Game”– means any one or more Game(s) available on the Platform in either Standard Play or Promotional Play. We reserve the right to add and remove Games from the Platform at our sole discretion.</li>
                                <li>f) “Gold Coin”– means the virtual social gameplay currency which enables you to play the Standard Play Games. Gold Coins have no monetary value and cannot under any circumstance be redeemed for Prizes.</li>
                                <li>g) “Participate”, “Participating” or “Participation”– means playing any Games or using our Platform in any manner whatsoever, including any of the conduct described in clause 6, 9, 10, 11 and 12.</li>
                                <li>h) “Payment Administration Agent”– means any payments facilitators and / or the service provided through any related body corporate, affiliate, or third party we appoint to act as our agent.</li>
                                <li>i) "Payment Medium" – means any card, online wallet, financial/bank account or other payment medium used to purchase Gold Coins.</li>
                                <li>j) "Platform" – means the services provided through any URL or mobile application belonging to, or licensed to, Playforges, and branded as part of the Playforges games, including the website located at playforges.us, and all subdomains, subpages and successor sites thereof, as well as all Games, features, tools and services available thereon.</li>
                                <li>k) “Customer” or “you” – means any person who Participates, whether or not a Registered Customer.</li>
                                <li>l) “Prizes”– means valuable prizes that can be redeemed using Playforges Cash won through Promotional Play in accordance with these Terms.</li>
                                <li>m) “Promotional Play” or “Sweepstakes”– means Participation in our sweepstakes promotions by playing the Platform’s game with Playforges Cash.</li>
                                <li>n) “Registered Customer" – means a Customer who has successfully registered a Customer Account, whether that account is considered active or not.</li>
                                <li>o) “Standard Play" – means Participating in any game played with Gold Coins.</li>
                                <li>p) "Playforges Cash" – means sweepstakes entries.</li>
                                <li>q) "Third Party Website”– means a third-party website not controlled by us.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">4. REGISTRATION & CUSTOMER WARRANTIES</h2>
                            <h3 className="text-xl font-semibold text-white mb-2">4.1. Registration</h3>
                            <p className="leading-relaxed mb-4">
                                a) When you try to register a Customer Account you will be requested to provide the following information: i. Full legal name; ii. Date of birth; iii. Permanent Address; iv. E-mail.<br/>
                                b) Playforges will also request you to provide a copy of your identification document and proof of address upon registration. For the purpose of this verification, we may accept driver's license or other government issued identification document which is permitted to be used for identification purposes and contains your residential address. You will also be requested to set a username and password. Please note that how we collect, use, maintain and disclose your personal information is governed by our privacy policy.
                            </p>
                            
                            <h3 className="text-xl font-semibold text-white mb-2">4.2. Warranties</h3>
                            <p className="leading-relaxed mb-4">
                                a) You declare and warrant that: i. You are over 21 years of age or such higher minimum legal age of majority as stipulated in the jurisdiction of your residence and are, under the laws applicable to you, legally allowed to participate in the Games offered on the Platform; ii. WHEN PARTICIPATING IN STANDARD OR PROMOTIONAL PLAY, YOU DO NOT RESIDE IN, OR ACCESS THE PLATFORM FROM, THE EXCLUDED TERRITORIES; iii. You use our Platform strictly in your personal capacity for recreational and entertainment purposes only; iv. You participate in the Games on your own behalf and not on behalf of any other person; v. All information that you provide to us during the term of validity of these Terms is true, complete and correct, and you will immediately notify us of any change to such information; vi. Cryptocurrency or FIAT currency (“FIAT”) that you use to purchase Gold Coins is not tainted with any illegality and, in particular, does not originate from any illegal activity or source, or from ill-gotten means; vii. You will not purchase Gold Coins from a business or corporate account, but only a wallet held in your name; viii. You will not be involved in any fraudulent, collusive, fixing or other unlawful activity in relation to your or third parties’ participation in any of the Games and you will not use any software-assisted methods or techniques (including but not limited to bots designed to play automatically) or hardware devices for your participation in any of the Games. We reserve the right to invalidate any participation in the event of such behavior; ix. When purchasing Gold Coins, you must only use a valid Payment Medium which lawfully belongs to you.
                            </p>
                            <p className="leading-relaxed mb-4">
                                b) It is a Customer’s sole responsibility to ensure that their Participation is lawful in their jurisdiction.<br/>
                                c) Any person who is knowingly in breach of Clauses 2, 4 and 23, including but not limited to any attempt to circumvent any restrictions regarding Excluded Territories and jurisdictions, for example, by using a service that masks or manipulates the identification of your real location, or by otherwise providing false or misleading information regarding your location or place of residence, or by Participating from an Excluded Territory or through a third party or on behalf of a third party located in an Excluded Territory, is in breach of these Terms. You may be committing fraud and may be subject to criminal prosecution.<br/>
                                d) You shall not act in a manner that is defamatory, trade libelous, threatening, or harassing.<br/>
                                e) You shall not engage in potentially fraudulent or suspicious activity and/or transactions.<br/>
                                f) You must cooperate in any investigation or provide confirmation of your identity or the accuracy of any information you provide to us.<br/>
                                g) You shall not provide false, inaccurate or misleading information in connection with your use of the Platform, in communications with Playforges, or otherwise connected with these Terms.<br/>
                                h) You shall not violate, or attempt to violate, (1) any law, statute, or ordinance; or (2) Playforges’s or any third-party’s copyright, patent, trademark, trade secret, or other intellectual property rights, or rights of publicity or privacy.<br/>
                                i) You declare that your access and use of the Platform and/or the Games, and your execution and delivery of, and the performance of your obligations under these Terms, will not result in a breach of any applicable laws, rules or regulations or of any order, decree or judgment of any court, any award of any arbitrator or those of any governmental or regulatory authority in any jurisdiction.
                            </p>
                            
                            <h3 className="text-xl font-semibold text-white mb-2">4.3 Eligible Customers</h3>
                            <p className="leading-relaxed mb-4">
                                Employees and contractors of Playforges, any of its respective affiliates, subsidiaries, holding companies, advertising agencies, or any other company or individual involved with the design, production, execution or distribution of the Games and their immediate family and household members are not eligible to Participate.
                            </p>
                            
                            <h3 className="text-xl font-semibold text-white mb-2">4.4 Acceptance</h3>
                            <p className="leading-relaxed mb-4">
                                By accepting these Terms you agree that your Participation is at your sole option, discretion and risk. You will have no claims whatsoever against us or any of our partners, or respective directors, officers, employees, or contractors in relation to your use of the Platform or the Games.
                            </p>
                        </section>
                        
                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">5. LICENCE</h2>
                            <p className="leading-relaxed mb-4">
                                5.1. Subject to your agreement and continuing compliance with these Terms, Playforges grants you a personal, non-exclusive, non-transferable, non-sublicensable, revocable, limited license to access and use the Platform, including Gold Coins and Playforges Cash, through a supported web browser or mobile device, solely for your personal, private entertainment and no other reason.<br/>
                                5.2. These Terms do not grant you any right, title or interest in the Platform or Content.<br/>
                                5.3. You acknowledge and agree that your license to use the Platform is limited by these Terms and if you do not agree to, or act in contravention of, these Terms, your license to use the Platform (including the Games and Content) shall be immediately and automatically terminated by Playforges (without any liability to you whatsoever).<br/>
                                5.4. In the event that the Platform or any Game is deemed to be illegal under the laws of the jurisdiction in which you reside or are situated, you are not granted any license to, and must refrain from accessing, the Platform or relevant Game.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">6. YOUR CUSTOMER ACCOUNT</h2>
                            <h3 className="text-xl font-semibold text-white mb-2">6.1. Single Account</h3>
                            <p className="leading-relaxed mb-4">
                                a) You are allowed to have only one Customer Account, including any inactive Account, on the Platform. If you attempt to open more than one Customer Account, all accounts you have opened or try to open may be cancelled or suspended and the consequences described in clause 23 may be enforced.<br/>
                                b) You must notify us immediately if you notice that you have more than one registered Customer Account, whether active or not, on the Platform.<br/>
                                c) DO NOT CREATE A NEW CUSTOMER ACCOUNT IF YOU WISH TO CHANGE YOUR EMAIL, ADDRESS OR OTHER PERSONAL INFORMATION.
                            </p>
                            
                            <h3 className="text-xl font-semibold text-white mb-2">6.2. Accuracy</h3>
                            <p className="leading-relaxed mb-4">
                                a) You are required to keep your registration details up to date at all times.<br/>
                                b) All the personal information provided by you when creating your Customer Account or any further subsequent updates to your Customer Account, must be identical to that listed on your government issued identification.
                            </p>
                            
                            <h3 className="text-xl font-semibold text-white mb-2">6.3. Security and Responsibility of Your Customer Account</h3>
                            <p className="leading-relaxed mb-4">
                                a) As part of the registration process, you will have to choose a password to login into the Platform.<br/>
                                b) It is your sole and exclusive responsibility to ensure that your Customer Account login details and any Payment Methods are kept secure and are only accessible by you. You accept full responsibility for any unauthorized use of your Customer Account and any activity linked to your Customer Account, including by a minor (which, in all events, is prohibited).<br/>
                                c) WE STRONGLY RECOMMEND THAT YOU ENABLE MULTI-FACTOR AUTHENTICATION FOR YOUR CUSTOMER ACCOUNT.<br/>
                                d) You must not share your Customer Account or password with another person, let anyone else access or use your Customer Account or do any other thing that may jeopardize the security of your Customer Account.<br/>
                                e) If you become aware of, or reasonably suspect that security in your Customer Account has been compromised, including loss, theft or unauthorized disclosure of your password and Customer Account details, you must notify us immediately.<br/>
                                f) You are solely responsible for maintaining the confidentiality of your password and you will be held responsible for all uses of your Customer Account, including any purchases made under the Customer Account, whether those purchases were authorized by you or not.<br/>
                                g) You are solely responsible for anything that happens through your Customer Account, whether or not you undertook those actions.<br/>
                                h) You acknowledge that your Customer Account may be terminated if someone else uses it and/or engages in any activity that breaches these Terms or is otherwise illegal.<br/>
                                i) Playforges is not responsible for any abuse or misuse of your Customer Account by third parties due to your disclosure of your login details to any third party, whether such disclosure is intentional or accidental, active or passive.
                            </p>
                            
                            <h3 className="text-xl font-semibold text-white mb-2">6.4. Transfer of Accounts, Gold Coins and Playforges Cash</h3>
                            <p className="leading-relaxed mb-4">
                                a) You are not allowed to transfer Gold Coins or Playforges Cash between Customer Accounts, or from your Customer Account to other Customers, or to receive Gold Coins or Playforges Cash from other Customer Accounts into your Customer Account, or to transfer, sell and/or acquire Customer Accounts. You may not attempt to sell, trade, or transfer Gold Coins or Playforges Cash, whether on the Platform or off the Platform.<br/>
                                b) You are not allowed to convert Gold Coins to Playforges Cash or vice versa.<br/>
                                c) You are prohibited from selling, transferring or acquiring Customer Accounts to or from other Customers. If you attempt to sell, transfer or acquire a Customer Account, all accounts you have opened or tried to sell, transfer or acquire will be cancelled (at our absolute discretion, and with no liability to you whatsoever) and the consequences described in clause 23 may be enforced.
                            </p>
                            
                            <h3 className="text-xl font-semibold text-white mb-2">6.5. Closing of Customer Accounts</h3>
                            <p className="leading-relaxed mb-4">
                                a) If you wish to close your Customer Account you may do so at any time by sending an e-mail to lorenzo@playforges.us. Closing your Customer Account will forfeit all continued access to and right to use, enjoy or benefit from any Gold Coins, Playforges Cash and unredeemed Prizes associated with your Customer Account.<br/>
                                b) If you have concerns about possible responsible social gameplay issues, please consult our Gameplay Self Exclusion Policy.<br/>
                                c) You will be able to open your Customer Account again (unless you have implemented a self-exclusion) by sending an e-mail to lorenzo@playforges.us. All requests for the re-opening of an account will be evaluated by our Customer Support and Compliance teams, who abide by strict customer protection guidelines and applicable laws.
                            </p>
                            
                            <h3 className="text-xl font-semibold text-white mb-2">6.6. Discretion to Refuse or Close Accounts</h3>
                            <p className="leading-relaxed mb-4">
                                Playforges reserves the right to place limits on, suspend, close or refuse to open a Customer Account in its sole discretion, and without any liability to you whatsoever.
                            </p>
                        </section>
                        
                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">7. GOLD COINS</h2>
                            <h3 className="text-xl font-semibold text-white mb-2">7.1. Gold Coins</h3>
                            <p className="leading-relaxed mb-4">
                                a) Gold coins do not have a monetary value and can only be used to play Standard Games. Gold Coins can be used for entertainment only and cannot be redeemed for any value whatsoever.<br/>
                                b) Playforges will give Gold Coins free of charge on: i. Daily Bonus– You can claim Gold Coins once per day, through logging into your Customer Account and claiming your daily bonus. ii. Promotional Giveaways – Promotional giveaways organized by Playforges on its social media accounts (for example, Facebook, Twitter, Instagram).<br/>
                                c) You may also win more Gold Coins when you play in Standard Play and you may purchase more Gold Coins on the Platform.<br/>
                                d) You cannot win Prizes when you Participate in Standard Play.
                            </p>
                            
                            <h3 className="text-xl font-semibold text-white mb-2">7.2. Gold Coin Purchases</h3>
                            <p className="leading-relaxed mb-4">
                                a) The purchase of Gold Coins is the purchase of a license that allows you to Participate in Standard Play Games and it is not a deposit of funds which can be withdrawn. Funds used to purchase Gold Coins will not, and cannot, be refunded to you. Gold Coins do not have any real money value.<br/>
                                b) You can purchase Gold Coins on the Platform through one of the Payment Methods available on the website.<br/>
                                c) The Payment Methods you use to purchase Gold Coins must be legally and beneficially owned by you and in your name. If it comes to our attention that the name you registered on your Customer Account and the name linked to your Payment Method differs, your Customer Account will be immediately suspended. Should your Customer Account be suspended, we recommend that you contact Customer Support through lorenzo@playforges.us.<br/>
                                d) Playforges reserves the right to request documents and information to verify the legal and beneficial ownership of the Payment Methods you use to make Gold Coin purchases.<br/>
                                e) You agree that we and/or our Payment Administration Agents may store your payment information to process your future purchases. By accepting these Terms, you authorize Playforges and/or our Payment Administration Agents to store your payment credentials in compliance with applicable payment processing regulations.<br/>
                                f) Once a Gold Coin purchase has been made, the funds will be withdrawn from your Payment Methods as soon as practicable.<br/>
                                g) The maximum Gold Coin purchase that can be made is USD $ 9,000 (nine thousand US dollars) per day.<br/>
                                h) If you are found to have one or more of your purchases returned and/or reversed or charged back, your account will be suspended. If this occurs, the amount of such purchases will constitute a debt owed by you to us and you must immediately remit payment for such purchases through an alternative payment method. Until payment is received by us or our Payment Administration Agent, your account will be suspended and any purchases will be deemed void and requests to redeem any Playforges Cash will not be allowed.
                            </p>
                            
                            <h3 className="text-xl font-semibold text-white mb-2">7.3. Currency</h3>
                            <p className="leading-relaxed mb-4">
                                a) All Gold Coin purchases must be made using FIAT or a cryptocurrency supported by the Platform.<br/>
                                b) Any exchange or transaction fees, charges or related costs that may be incurred as a result of, or in relation to, your purchase of Gold Coins are to be borne solely by you, including but not limited to any losses or additional costs arising from foreign exchange fluctuations.<br/>
                                c) If you purchase Gold Coins using FIAT, then you must redeem Playforges Cash using FIAT. If you purchase Gold Coins using cryptocurrency, then you must redeem Playforges Cash in cryptocurrency. Only once your Playforges Cash reaches a zero balance, you may then elect your preferred currency (FIAT or cryptocurrency) for future purchases of Gold Coins or redemptions of Playforges Cash. For the avoidance of any doubt, if you have any Playforges Cash in your wallet, then you cannot switch between FIAT and cryptocurrency for the purchase of Gold Coins or redemption of Playforges Cash.
                            </p>
                        </section>
                        
                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">8. PLAYFORGES CASH</h2>
                            <p className="leading-relaxed mb-4">
                                8.1. a) Customers who receive promotional Playforges Cash can use that Playforges Cash to play Promotional Play Games within Playforges. Playforges Cash can only be used to play Promotional Play Games.<br/>
                                b) YOU CANNOT PURCHASE PLAYFORGES CASH. PLAYFORGES CASH CAN BE OBTAINED ONLY THROUGH FREE, PROMOTIONAL OFFERS.
                            </p>
                            <h3 className="text-xl font-semibold text-white mb-2">8.2. How to receive Playforges Cash</h3>
                            <p className="leading-relaxed mb-4">
                                a) You can obtain Free Playforges Cash through the following means:<br/>
                                i. Daily Login Bonus – You can claim Playforges Cash once per day, through logging into your Customer Account and claiming your daily bonus.<br/>
                                ii. Promotional Giveaways – Promotional giveaways organized by Playforges on its social media (for example, Facebook, Twitter, Instagram). The amount of Playforges Cash given away will be stated on the applicable Promotional Giveaway contest.<br/>
                                iii) Post Card – Customers can receive 5 free Playforges Cash by sending a standard postcard on the terms set out in the clause 8.3.<br/>
                                b) From time to time, you may also be offered promotional Playforges Cash as a bonus when purchasing Gold Coins. Customers may receive Playforges Cash as a bonus upon the purchase of specifically marked packs of Gold Coins. The number of Playforges Cash a Customer will receive as a bonus for each relevant Gold Coin purchase will be stated on the website at the time of purchase. All purchases of Gold Coins are final and no refunds will be given.<br/>
                                c) Use of any automated or other system(s) to Participate, acquire Playforges Cash or play the Games is strictly prohibited and will result in disqualification and loss of eligibility to Participate in the Games.
                            </p>
                            
                            <h3 className="text-xl font-semibold text-white mb-2">8.3. Playforges Cash through Post Card</h3>
                            <p className="leading-relaxed mb-4">
                                a) Customers can receive 5 free Playforges Cash by sending a standard postcard or piece of white paper (Request Card) which must be at least 4” x 6”, unfolded, and placed inside a stamped envelope addressed to the following address and satisfying the requirements set out below: Playforges Limited 54-56 Riga Feraiou, Lizantia Court, Office 310, Agioi Omologites, 1087 Nicosia, Cyprus<br/>
                                b) The post card or request card, shall comply with the following criteria:<br/>
                                i. handwrite their return address on the front of the envelope and the words: “Playforges Cash Credits”; and<br/>
                                ii. Handwrite all of the following, in the exact same order, on only one side of the Request Card inserted inside the envelope: a. Full name as shown on their government issued identification; b. the customer's playforges.us username; c. the return/residential address registered to their playforges.us account; d. the email address registered to their playforges.us account; e. clearly placed word "CODE:" followed by the unique postcard code (generated here). This code is unique to each customer and must not be shared with other customers; and f. the following statement: “I wish to receive Playforges Cash to participate in the sweepstakes promotions offered by PlayforgesSweepstakes. By submitting this request, I hereby declare that I have read, understood and agree to be bound by Playforges’s Terms and Conditions.”<br/>
                                g) There is a limit of one Request Card per outer envelope.<br/>
                                h) A Customer must ensure that their handwriting is legible. If the Customer's handwriting is not legible, the entry will be void and the Playforges Cash will not be credited to the Customer's Customer Account. The legibility of a Customer's handwriting will be determined by Playforges in its sole discretion. For the avoidance of any doubt, the requirement for the Post Card to be “handwritten” means that the Customer must personally hand write each entry and not use any stencil or copying machine.<br/>
                                i) The request must only be made by the Customer and must be posted from the same state or province as the Customer's verified residential address. Requests made by any other individual or any entity (including but not limited to commercial sweepstakes subscription notification and/or entering services) or posted from a State or Province different to the Customer's verified residential address will be declared invalid and Playforges Cash will not be credited to the Customer's Customer Account.<br/>
                                j) PLAYFORGES RESERVES THE RIGHT TO REJECT REQUEST CARDS FROM EXCLUDED TERRITORIES.<br/>
                                k) Requests made by any other individual or any entity (including but not limited to commercial sweepstakes subscription notification and/or entering services) or posted from an Excluded Territory different to the Customer's verified residential address will be declared invalid.<br/>
                                l) Tampering with the entry process or the operation of the Sweepstakes, including but not limited to the use of any device to automate the Playforges Cash request/entry process, or to otherwise abuse the process, is prohibited and any requests/entries deemed by Playforges, in its sole discretion, to have been submitted in this manner will be void. In the event a dispute regarding the identity of the individual who actually submitted a request or whether a request satisfies the requirements set out above cannot be resolved to Playforges’s satisfaction, the affected request/entry will be deemed ineligible.<br/>
                                m) All cards that are submitted without a valid unique postcard code using the code generator, will be rejected.<br/>
                                n) For each Request Card a Customer submits in accordance with the above requirements, the Customer will receive 5 Playforges Cash.
                            </p>

                            <h3 className="text-xl font-semibold text-white mb-2">8.4. Playforges Cash Balance</h3>
                            <p className="leading-relaxed mb-4">
                                a) The amount of Playforges Cash a Customer has will be displayed in their Customer Account on the website.<br/>
                                b) The amount of Playforges Cash to be allocated to Customers can be changed at any time by Playforges in its sole discretion, without any liability to you whatsoever.<br/>
                                c) Playforges is not responsible for lost, late, incomplete, invalid, unintelligible or misdirected Playforges Cash requests or allocations.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">9. GAMES</h2>
                            <h3 className="text-xl font-semibold text-white mb-2">9.1. Rules</h3>
                            <p className="leading-relaxed mb-4">
                                a) To participate in any Standard or Promotional Play, you must have an active Customer Account and agree to be bound by these Terms.<br/>
                                b) You may participate in any Game only if you have sufficient Gold Coins or Playforges Cash(as applicable) in your Customer Account for such Participation.<br/>
                                c) Games offered on the Platform may have their own rules which are available on the Platform. It is your responsibility to read the rules of a Game before playing and they are binding upon you as if they form part of these Terms. You must familiarize yourself with the applicable terms of play and read the relevant rules before playing any Game.<br/>
                                d) Gold Coins or Playforges Cash that have been submitted for play and accepted cannot be changed or cancelled, and the Gold Coins or Playforges Cash (whichever applicable) will be drawn from your Gold Coin or Playforges Cash balance instantly.
                            </p>
                            
                            <h3 className="text-xl font-semibold text-white mb-2">9.2. Void Games</h3>
                            <p className="leading-relaxed mb-4">
                                Playforges reserves the right to declare Participation in a Game void, partially or in full, if, in our sole discretion, we deem it obvious that there was an error, mistake, misprint or technical error on the pay-table, win-table, minimum or maximum stakes, odds or software.
                            </p>

                            <h3 className="text-xl font-semibold text-white mb-2">9.3. Final Decision</h3>
                            <p className="leading-relaxed mb-4">
                                In the event of a discrepancy between the result showing on a user’s device and Playforges server software, the result showing on the Playforges server software will be the official and governing result.
                            </p>
                        </section>
                        
                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">10. STANDARD PLAY</h2>
                            <p className="leading-relaxed mb-4">
                                10.1. Standard Play can only be played with Gold Coins.<br/>
                                10.2. On Standard Play you can only win Gold Coins.<br/>
                                10.3. You cannot win money or Prizes of any kind when playing on Standard Play.
                            </p>
                        </section>
                        
                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">11. PROMOTIONAL PLAY / SWEEPSTAKES</h2>
                            <p className="leading-relaxed mb-4">
                                11.1. Promotional Play / Sweepstakes can only be played with Playforges Cash.<br/>
                                11.2. It is the sole responsibility of a Customer to determine whether the Sweepstakes is legal and compliant with all regulations in the jurisdiction in which the Customer resides.<br/>
                                11.3. Within Playforges there are different Games. The amount of Playforges Cash required to play each Game, and the applicable rules will be detailed in the informational pages associated with a particular Game.<br/>
                                11.4. Only Games played with Playforges Cash provide the opportunity to redeem for Prizes. The Prize that can be won while playing a Game will be shown in the Platform by clicking the “Redeem” button.<br/>
                                11.5. Playforges’s decisions as to the administration and operation of the Sweepstakes, the Game and the amount and nature of any Prizes are final and binding.
                            </p>
                        </section>
                        
                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">12. PROMOTIONS</h2>
                            <p className="leading-relaxed mb-4">
                                12.1. All promotions, including Games played in Promotional Play, contests and promotions are subject to these Terms, and to additional terms that may be published at the time of the promotion.<br/>
                                12.2. In the event and to the extent of any conflict between these Terms and any promotion-specific terms and conditions, the promotion-specific terms and conditions will prevail to the extent of the inconsistency.<br/>
                                12.3. Playforges reserves the right to withhold or modify any promotions on the Platform without prior notice to you and without any liability to you whatsoever.<br/>
                                12.4. If, in the reasonable opinion of Playforges, a Registered Customer is abusing any promotion, to derive any advantage or gain for themselves or other Registered Customers, including by way of Fraudulent Conduct, we may, at our sole and absolute discretion, withhold, deny or cancel any advantage, bonus or Prize as we see fit.
                            </p>
                        </section>
                        
                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">13. REDEMPTION OF PRIZES</h2>
                            <h3 className="text-xl font-semibold text-white mb-2">13.1. Prizes</h3>
                            <p className="leading-relaxed mb-4">
                                a) Only Promotion Play / Sweepstakes give access to Prizes. No Prizes can be won through Standard Play.<br/>
                                b) Only Playforges Cash can be redeemed for Prizes.<br/>
                                c) With the exception of Playforges Cash won through Promotional Play, all Customers are required to play their Playforges Cash three (3) times before it is eligible to be redeemed for Prizes.<br/>
                                d) Playforges reserves the right to change the Prize, win rates and odds of any of the Sweepstakes at any time at our absolute discretion. It is a Customer's responsibility to check the Prize win rate on each occasion before they participate.<br/>
                                e) No Prize can be redeemed without completing the identification process as required by Playforges, at our absolute discretion.
                            </p>

                            <h3 className="text-xl font-semibold text-white mb-2">13.2. Prize Redemption Methods</h3>
                            <p className="leading-relaxed mb-4">
                                a) The Prizes for which you can redeem your Playforges Cash will be identified on the Platform and can change from time to time at Playforges’s absolute discretion.<br/>
                                b) Prizes may include, but are not necessarily limited to:<br/>
                                i. Cryptocurrency (subject to conditions being met as outlined in these Terms); and<br/>
                                ii. FIAT (subject to conditions being met as outlined in these Terms).
                            </p>

                            <h3 className="text-xl font-semibold text-white mb-2">13.3. Limits and Fees</h3>
                            <p className="leading-relaxed mb-4">
                                a) Playforges reserves the right to charge fees for processing the redemption of Prizes to you and to set a minimum redemption threshold for Prize redemptions.<br/>
                                b) In Florida, the maximum redemption value of Playforges Cash won on any Game or play, via a Customer’s participation in the Sweepstakes, is USD $5,000 (five thousand US dollars) per day. Any redemption of a Prize valued in excess of USD $5,000 (five thousand US dollars) per day will not be allocated or paid.
                            </p>

                            <h3 className="text-xl font-semibold text-white mb-2">13.4. Redeeming for Cryptocurrency</h3>
                            <p className="leading-relaxed mb-4">
                                a) When you elect to redeem Playforges Cash for cryptocurrency, you must select your “Wallet” account, press “Redeem,” and choose the cryptocurrency to which you wish to redeem for.<br/>
                                b) When you choose to redeem Playforges Cash for cryptocurrency, it is your sole responsibility to ensure that the crypto wallet to which you are transferring the funds can receive those funds. Playforges has no obligation to check or verify whether your wallet will accept the cryptocurrency you select or nominate.<br/>
                                c) Playforges Cash will be redeemable at an implied rate of 1 Playforges Cash per 1 USD. As such, the amount of cryptocurrency that can be redeemed per 1 Playforges Cash will be determined by the market price of that cryptocurrency in USD at the time of such redemption (as determined in our discretion).<br/>
                                d) You can only redeem your Playforges Cash using the same cryptocurrency you used when purchasing Gold Coins on the Platform. You will only be permitted to redeem Playforges Cash in cryptocurrency if you have satisfied the conditions in clause 7.3(c) of these Terms.
                            </p>
                            
                            <h3 className="text-xl font-semibold text-white mb-2">13.5 Redeeming for FIAT</h3>
                            <p className="leading-relaxed mb-4">
                                a) You will only be permitted to redeem Playforges Cash in FIAT if you have satisfied the conditions in clause 7.3(c) of these Terms.<br/>
                                b) When you elect to redeem Playforges Cash for FIAT, you must select your “Wallet” account, press “Redeem,” and choose the FIAT currency you wish to redeem.<br/>
                                c) When you choose to redeem Playforges Cash for FIAT currency, it is your sole responsibility to ensure that the bank account to which you are transferring the FIAT is capable of receiving those funds.<br/>
                                d) Playforges Cash will be redeemable at an implied rate of 1 Playforges Cash per 1 USD. As such, the amount of FIAT currency that can be redeemed per 1 Playforges Cash will be determined by the exchange rate of the FIAT currency against 1USD.
                            </p>

                            <h3 className="text-xl font-semibold text-white mb-2">13.6. Timing and Frequency for Prize Redemptions</h3>
                            <p className="leading-relaxed mb-4">
                                a) We process requests to redeem Prizes in the order in which they are received. Our goal is to process your request as soon as practicable.<br/>
                                b) We will only process one Prize redemption request per Customer Account in any 24-hour period.<br/>
                                c) There may be delays in payments due to our identity verification process. Certain Payment Mediums will require additional verification at the time of redemption and we do not accept any liability to you in respect of any delays arising from these verification processes.<br/>
                                d) Without limiting clause 13, Customers can request to redeem Prizes of any value. However, we reserve the right to allocate or pay Prizes in smaller increments over a number of days until all of the Prize has been allocated or paid.
                            </p>

                            <h3 className="text-xl font-semibold text-white mb-2">13.7. Refused Prizes & Mistaken Credits</h3>
                            <p className="leading-relaxed mb-4">
                                If we mistakenly credit your Customer Account from time to time with Prizes that do not belong to you, whether due to a technical error, human error or otherwise, the amount credited will remain Playforges property and will be deducted from your Customer Account. If you have been transferred cryptocurrency or FIAT that does not belong to you prior to us becoming aware of the error, the mistakenly paid amount will (without prejudice to other remedies and actions that may be available at law) constitute a debt owed by you to us. In the event of an incorrect crediting, you are obliged to notify Customer Support through lorenzo@playforges.us.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">14. VERIFICATION</h2>
                            <h3 className="text-xl font-semibold text-white mb-2">14.1. Verification Checks</h3>
                            <p className="leading-relaxed mb-4">
                                a) You agree that we are entitled to conduct any identification, credit and other verification checks that we may reasonably require and/or that are required of us under applicable laws and regulations or by relevant regulatory authorities or to otherwise prevent financial crime.<br/>
                                b) Until all required verification checks are completed to our satisfaction:<br/>
                                i. any request you have made for redemption of Prizes will remain pending; and<br/>
                                ii. we are entitled to restrict your Customer Account in any manner that we may reasonably deem appropriate, including by suspending or deactivating your Customer Account.<br/>
                                c) Where any identification, credit or other verification check we require cannot be completed to our satisfaction, because you have not provided any document we request from you in the form that we require within 30 days’ of the date the document was first requested, then we are under no obligation to continue with the verification check and we may, in our sole discretion, deactivate or otherwise restrict your Customer Account in any manner that we may reasonably deem appropriate.<br/>
                                d) Customers who request the redemption of Prizes held in a deactivated or suspended account should contact lorenzo@playforges.us.
                            </p>
                            
                            <h3 className="text-xl font-semibold text-white mb-2">14.2. External Verification Checks</h3>
                            <p className="leading-relaxed mb-4">
                                You agree that Playforges may use third party service providers to run external identification and other verification checks on all Customers on the basis of the information provided by you from time to time.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">15. RESPONSIBLE SOCIAL GAMEPLAY</h2>
                            <h3 className="text-xl font-semibold text-white mb-2">15.1. Policy</h3>
                            <p className="leading-relaxed mb-4">
                                a) Playforges actively supports responsible social gameplay and encourages its Customers to make use of a variety of responsible social gameplay features so as to better manage their Customer Account.<br/>
                                b) Playforges is committed to providing excellent customer service. Although Playforges will use all reasonable endeavors to enforce its responsible social gameplay measures, Playforges does not accept any responsibility or liability if you nevertheless continue gameplay and/or seek to use the Platform with the intention of deliberately avoiding the relevant measures in place and/or Playforges is unable to enforce its measures/policies for reasons outside of Playforges’s reasonable control.
                            </p>
                            
                            <h3 className="text-xl font-semibold text-white mb-2">15.2. Self-Exclusion</h3>
                            <p className="leading-relaxed mb-4">
                                You may, at any time, request a time-out or self-exclusion from our Games. Please check our self-exclusion procedure here.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">16. FRAUDULENT CONDUCT</h2>
                            <p className="leading-relaxed mb-4">
                                16.1. As a condition to access the Games or Platform, you may not, directly or indirectly:<br/>
                                a) hack into any part of the Games or Platform through password mining, phishing, or any other means;<br/>
                                b) attempt to modify, reverse engineer, or reverse-assemble any part of the Games or Platform;<br/>
                                c) knowingly introduce viruses, Trojans, worms, logic bombs, spyware, malware, or other similar material;<br/>
                                d) circumvent the structure, presentation or navigational function of any Game so as to obtain information that Playforges has chosen not to make publicly available on the Platform;<br/>
                                e) engage in any form of cheating or collusion;<br/>
                                f) use the Platform and the systems of Playforges to facilitate any type of illegal money transfer (including money laundering proceeds of crime); or<br/>
                                g) participate in or take advantage of, or encourage others to participate in or take advantage of schemes, organizations, agreements, or groups designed to share:<br/>
                                i. special offers or packages emailed to a specific set of Customers and redeemable by URL; or<br/>
                                ii. identification documents (including, but not limited to, photographs, bills and lease documents) for the purpose of misleading Playforges as to a Customer’s identity.
                            </p>
                            <p className="leading-relaxed mb-4">
                                16.2. You must not use the Platform for any unlawful or fraudulent activity or prohibited transaction (including Fraudulent Conduct) under the laws of any jurisdiction that applies to you. We monitor all transactions in order to prevent money laundering.<br/>
                                16.3. If Playforges suspects that you may be engaging in, or have engaged in fraudulent, unlawful or improper activity, including money laundering activities or any conduct which violates these Terms, your access to the Platform will be suspended immediately and your Customer Account may be deactivated or suspended, at Playforges’s absolute discretion. If your Customer Account is deactivated or suspended under such circumstances, Playforges is under no obligation to reverse any Gold Coin purchases you have made or to redeem any Playforges Cash that may be in your Customer Account. In addition, Playforges may pass any necessary information on to the relevant authorities, other online service providers, banks, credit card companies, electronic payment providers or other financial institutions. You will cooperate fully with any Playforges investigation into such activity.<br/>
                                16.4. If you suspect any unlawful or fraudulent activity or prohibited transaction by another Customer, please notify us immediately via the means of communication listed in the Customer Complaints procedure.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">17. INTELLECTUAL PROPERTY</h2>
                            <p className="leading-relaxed mb-4">
                                17.1. The computer software, the computer graphics, the Platform and the user interface that we make available to you is owned by, or licensed to, Playforges or its associates and protected by copyright laws. You may only use the software for your own personal, recreational uses in accordance with all rules, terms and conditions we have established (including these Terms) and in accordance with all applicable laws, rules and regulations.<br/>
                                17.2. You acknowledge that Playforges is the proprietor or authorized licensee of all intellectual property in relation to any Content.<br/>
                                17.3. Your use of the Games and Platform does not provide you with any intellectual property rights in the Content, Games or Platform.<br/>
                                17.4. You grant us, and represent and warrant, that you have the right to grant us an irrevocable, perpetual, worldwide, non-exclusive, royalty-free license to use in whatever way we see fit, any information, images, videos, comments, messages, music or profiles you publish or upload to any website or social media page controlled and operated by Playforges.<br/>
                                17.5. You must not reproduce or modify the Content in any way, including by removing any copyright or trademark notice.<br/>
                                17.6. All trademarks and logos displayed in the Games and Platform are the property of their respective owners and are protected by applicable trademark and copyright laws.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">18. THIRD PARTY WEBSITES, LINKS OR GAMES</h2>
                            <h3 className="text-xl font-semibold text-white mb-2">18.1. Third Party Websites</h3>
                            <p className="leading-relaxed mb-4">
                                a) You acknowledge and agree that Playforges is not responsible for any Third Party Websites and makes no guarantee as to the content, functionality, security or accuracy of any Third Party Website.<br/>
                                b) You further acknowledge that any Third Party Websites purporting to offer Gold Coins or Playforges Cash are not authorized to do so. Any purported Third Party Websites purporting to do so may be an effort to induce you to reveal personal information (including passwords, account information and credit card details). You agree that Playforges is not responsible for any actions you take at the request or direction of these or any other Third Party Websites.
                            </p>
                            <h3 className="text-xl font-semibold text-white mb-2">18.2. Links</h3>
                            <p className="leading-relaxed mb-4">
                                a) Any links to Third Party Websites do not:<br/>
                                i. indicate a relationship between Playforges and the third party; or<br/>
                                ii. indicate any endorsement or sponsorship by Playforges of the Third Party Website, or the goods or services it provides, unless specifically indicated by Playforges.<br/>
                                b) Where a website controlled and operated by Playforges contains links to certain social networking sites, such as Facebook and Twitter, you acknowledge and agree that:<br/>
                                i. any comments or content that you post on such social networking sites are subject to the terms and conditions of that particular social networking site;<br/>
                                ii. you will not post any comments that are false, misleading or deceptive or defamatory to us, our employees, agents, officers or other Customers; and<br/>
                                iii. we are not responsible or liable for any comments or content that you or others post on social networking sites.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">19. DISRUPTIONS AND CHANGE</h2>
                            <p className="leading-relaxed mb-4">
                                <strong>19.1. No warranties</strong><br/>
                                The Platform is provided on an “as is” basis and to the fullest extent permitted by law, we make no warranty or representation, whether express or implied, in relation to the satisfactory quality, fitness for purpose, completeness or accuracy of the Platform (including the Games and Content).
                            </p>
                            <p className="leading-relaxed mb-4">
                                <strong>19.2. Malfunctions</strong><br/>
                                a) WE DO NOT MAKE ANY REPRESENTATIONS OR WARRANTIES THAT ACCESS TO THE PLATFORM, ANY OF YOUR ACCOUNT(S) OR THE GAMES WILL BE CONTINUOUS,UNINTERRUPTED, TIMELY OR ERROR-FREE.<br/>
                                b) Playforges is not liable for any downtime, server disruptions, lagging or any technical or political disturbance to Game play, nor attempts by you to Participate by methods, means or ways not intended by us.<br/>
                                c) Playforges accepts no liability for any damages or losses which are deemed or alleged to have arisen out of or in connection with any Platform or its Content including, without limitation, delays or interruptions in operation or transmission, loss or corruption of data, communication or lines failure, any person’s misuse of a Platform or its Content or any errors or omissions in Content.<br/>
                                d) In the event of a Platform system malfunction all Game play on that Platform is void.<br/>
                                e) In the event a Game is started but fails to conclude because of a failure of the system, Playforges will use commercially reasonable efforts to reinstate the amount of Gold Coins or Playforges Cash played (whichever applicable) in the Game to you by crediting it to your Customer Account.<br/>
                                f) Playforges reserves the right to alter Customer balances and account details to correct such mistakes.<br/>
                                g) Playforges reserves the right to remove any part of the Games from the Platform at any time. Any part of the Games that indicate incorrect behavior affecting Prize redemption, game data, Gold Coin balances, Playforges Cash balances or other balances, that may be due to misconfiguration or a bug, will be cancelled and removed from the Platform. Customer balances and account details may be altered by Playforges in such cases in order to correct any mistake.
                            </p>
                            <p className="leading-relaxed mb-4">
                                <strong>19.3. Change</strong><br/>
                                Playforges reserves the right to suspend, modify, remove or add Content to the Platform at its sole discretion with immediate effect and without any notice to you. We will not be liable to you for any loss suffered as a result of any changes made or for any modification or suspension of or discontinuance of the Platform (including any Game) and you will have no claims against Playforges on this basis.
                            </p>
                            <p className="leading-relaxed mb-4">
                                <strong>19.4. Service Suspension</strong><br/>
                                We may temporarily suspend the whole or any part of the Platform for any reason at our sole discretion. We may, but will not be obliged to, give you as much notice as is reasonably practicable of such suspension. We will restore the Platform as soon as is reasonably practicable after such temporary suspension.
                            </p>
                            <p className="leading-relaxed mb-4">
                                <strong>19.5 Viruses</strong><br/>
                                Although we take reasonable measures to ensure that the Platform is free from viruses we cannot and do not guarantee that the Platform is free of such problems. It is your responsibility to protect your systems and have in place the ability to reinstall any data or programs lost due to a virus.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">20. PRIVACY POLICY</h2>
                            <p className="leading-relaxed mb-4">
                                20.1. Playforges is committed to protecting and respecting your privacy and complying with all applicable data protection and privacy laws.<br/>
                                20.2. Our Privacy Policy is incorporated into these Terms and its acceptance is a prerequisite to creating a Customer Account.<br/>
                                20.3. You consent to receive marketing communications from Playforges in respect of its offerings by way of email, notifications, any of which you may unsubscribe from at any time by contacting Customer Support via lorenzo@playforges.us.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">21. USE OF LIVE CHAT SERVICES</h2>
                            <p className="leading-relaxed mb-4">
                                21.1. We may provide you with a Live Chat service to talk to our Customer Support representatives or to talk to other Customers. It is your responsibility to use these services only for their intended purposes. You are not permitted to use our Live Chat services for illegal purposes.<br/>
                                21.2. Be careful what you post on any Live Chat service. We review and moderate chats, and keep a log and record of statements. Your use of the Live Chat service should be for recreational and social purposes only.<br/>
                                21.3. Spamming on Live Chat is prohibited. You are prohibited from intimidating, harassing or abusing other Customers or Playforges employees and representatives.<br/>
                                21.4. You will not use any Live Chat service to engage in any form of harassment or offensive behavior, including but not limited to, threatening, derogatory, abusive or defamatory statements, or racist, sexually explicit, pornographic, obscene or offensive language.<br/>
                                21.5. You will not use any Live Chat service to infringe the privacy rights, property rights or any other rights of any person.<br/>
                                21.6. You will not submit any kind of material or information on any Live Chat service that is fraudulent or otherwise unlawful or violates any law.<br/>
                                21.7. You will not use any Live Chat service to distribute, promote or otherwise publish any material containing any solicitation for funds, advertising or solicitation for goods or services of other forums.<br/>
                                21.8. You will not use any Live Chat service to distribute, promote or otherwise publish any kind of malicious code or do anything else that might cause harm to the Platform or to other Customer’s systems in any way.<br/>
                                21.9. We reserve the right to monitor anything and everything submitted by you to any Live Chat service to ensure that it conforms to content guidelines that are monitored by us and subject to change from time to time.<br/>
                                21.10. If you breach any of the provisions relating to a Live Chat service, we may ban you from using that Live Chat service or all Live Chat services and/or suspend or deactivate your Customer Account. If we deactivate your Customer Account, we reserve the right to cancel or refuse to redeem any Prizes.<br/>
                                21.11. We reserve the right to remove any Live Chat service from the Platform if abused.<br/>
                                21.12. We will not be liable if damage arises out of the Live Chat service.<br/>
                                21.13. You agree to unconditionally indemnify us against any damages arising out of your illegal, unlawful or inappropriate conduct or arising out of violation of the provisions in clause 21 or any other rules on the Platform applying to the Live Chat service.<br/>
                                21.14. You will not collude in any way through the Live Chat service. Customers are encouraged to report any suspicious behavior to Customer Support via this form.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">22. COMPLAINTS AND CUSTOMER SUPPORT</h2>
                            <p className="leading-relaxed mb-4">
                                22.1. You may send correspondence, including inquiries or complaints, to our support team at lorenzo@playforges.us.<br/>
                                22.2. TO PROTECT YOUR PRIVACY AND SO THAT OUR SUPPORT TEAM CAN VERIFY YOUR ACCOUNT, ALL EMAIL COMMUNICATIONS BETWEEN YOU AND PLAYFORGES SHOULD BE CARRIED OUT USING THE EMAIL ADDRESS THAT YOU HAVE REGISTERED ON YOUR CUSTOMER ACCOUNT. FAILURE TO DO SO WILL RESULT IN OUR SUPPORT TEAM REQUESTING YOU COMMUNICATE FROM THE EMAIL ADDRESS REGISTERED ON YOUR ACCOUNT.<br/>
                                22.3. The following information must be included in any written communication with Playforges (including a complaint): a) your username; b) your first and last name, as registered on your Customer Account; c) a detailed explanation of the complaint/claim; and d) any specific dates and times associated with the complaint/claim (if applicable).<br/>
                                22.4. Failure to submit a written communication with the information outlined above may result in a delay in our ability to identify and respond to your correspondence in a timely manner.<br/>
                                22.5. Playforges will endeavour to respond to correspondence as soon as possible from the receipt of the email.<br/>
                                22.6. You are prohibited from spamming the Playforges support team. You are prohibited from using threatening, abusive, offensive or harassing language in any email to Playforges support employees. This includes but is not limited to, threatening, derogatory, abusive or defamatory statements, or racist, sexually explicit, pornographic, obscene, or offensive language. If you breach any of the provisions relating to email etiquette or communication with Playforges employees, we reserve the right not to reply to your correspondence, suspend or deactivate your Customer Account. Further, if we deactivate your Customer Account, we reserve the right to cancel or refuse to redeem any Prizes.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">23. DEACTIVATION/SUSPENSION OF ACCOUNT</h2>
                            <p className="leading-relaxed mb-4">
                                23.1. Without limiting clause 4, we reserve the right, at our sole discretion, to deactivate or suspend your Customer Account (notwithstanding any other provision contained in these Terms) where we have reason to believe that you have engaged or are likely to engage in any of the following activities:<br/>
                                a) you breached, or assisted another party to breach, any provision of these Terms, or we have a reasonable grounds to suspect such breach;<br/>
                                b) you have more than one Customer Account, including any inactive Account, on the Platform;<br/>
                                c) the name registered on your Customer Account does not match the name on (i) your Payment Medium used to make purchases of Gold Coins or (ii) the account into which you elect to redeem Prizes or you do not legally and beneficially own such Payment Medium or redemption account;<br/>
                                d) your communication with us or other Customers consists of harassment or offensive behaviour, including but not limited to threatening, derogatory, abusive or defamatory statements, or racist, sexually explicit, pornographic, obscene or offensive language;<br/>
                                e) your Customer Account is deemed to be an inactive account (in the absolute discretion of Playforges);<br/>
                                f) you become bankrupt;<br/>
                                g) you provide incorrect or misleading information;<br/>
                                h) your identity or source of wealth or source of funds (if requested) cannot be verified;<br/>
                                i) you attempt to use your Customer Account through a VPN, proxy or similar service that masks or manipulates the identification of your real location, or by otherwise providing false or misleading information regarding your citizenship, location or place of residence, or by playing Games using the Platform through a third party or on behalf of a third party;<br/>
                                j) you are not over 21 years of age or such higher minimum legal age of majority as stipulated in the jurisdiction of your residence;<br/>
                                k) you are located in a jurisdiction where Participation is illegal;<br/>
                                l) you have allowed or permitted (whether intentionally or unintentionally) someone else to Participate using your Customer Account;<br/>
                                m) you have played in tandem with other Customer(s) as part of a club, group or played the Games in a coordinated manner with other Customer(s) involving the same (or materially the same) selections;<br/>
                                n) without limiting clause 7, where Playforges has received a “charge back”, claim or dispute and/or a “return” notification via your Payment Medium;<br/>
                                o) you have failed our due diligence procedures or are found by Playforges (in its discretion) to be colluding, cheating, money laundering or undertaking any kind of fraudulent activity; or<br/>
                                p) it is determined by Playforges that you have employed or made use of a system (including machines, computers, software or other automated systems such as bots) which give you an unfair advantage.
                            </p>
                            <p className="leading-relaxed mb-4">
                                23.2. Playforges reserves the right to suspend your customer Account at its absolute discretion whenever such suspension is necessary in order to protect the Platform, the public in general or other Customers.<br/>
                                23.3. If Playforges deactivates or suspends your Customer Account for any of the reasons referred to in clause 23.1 above, you will be liable for any and all claims, losses, liabilities, damages, costs and expenses incurred or suffered by Playforges (together “Claims”) arising therefrom and you will unconditionally indemnify and hold Playforges harmless on demand for such Claims.<br/>
                                23.4. If we have reasonable grounds to believe that you have participated in any of the activities set out in clause 23.1 above, then we reserve the right to withhold all or part of the balance and/or recover from your Customer Account any Prizes, Gold Coins or Playforges Cash that are attributable to any of the activities contemplated in clause 23.1. In such circumstances, your details may be passed on to any applicable regulatory authority, regulatory body or any other relevant external third parties at our absolute discretion.<br/>
                                23.5. If your Customer Account is deactivated as a result of closure of the Platform or similar event, we will make commercially reasonable efforts to enable redemption of any existing Prizes associated with your Customer Account, but all of your rights to use, enjoy or benefit from the Gold Coins and Playforges Cash will be terminated.<br/>
                                23.6. The rights set out in clause 23 are without prejudice to any other rights that we may have against you under these Terms or otherwise.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">24. INDEMNITY AND LIMITATION OF LIABILITY</h2>
                            <p className="leading-relaxed mb-4 uppercase text-sm">
                                24.1. Indemnity YOU AGREE TO INDEMNIFY AND HOLD HARMLESS PLAYFORGES AND ITS AFFILIATES, SUBSIDIARIES, ULTIMATE PARENT AND PARENT COMPANIES, PARTNERS, OFFICERS, DIRECTORS, EMPLOYEES, CONTRACTORS SHAREHOLDERS, AGENTS, LICENSORS, SUBCONTRACTORS OR SUPPLIERS, AND EACH OF THEIR RESPECTIVE OFFICERS, DIRECTORS, EMPLOYEES, AFFILIATES, AGENTS, LICENSORS, AND CONTRACTORS (“INDEMNIFIED PERSONS”) FROM AND AGAINST ANY CLAIMS, SUITS, ACTIONS, DEMANDS, DISPUTES, ALLEGATIONS, OR INVESTIGATIONS BROUGHT BY ANY THIRD-PARTY, GOVERNMENTAL AUTHORITY, OR INDUSTRY BODY, AND ALL LIABILITIES, DAMAGES (ACTUAL AND CONSEQUENTIAL), LOSSES, COSTS, AND EXPENSES, INCLUDING WITHOUT LIMITATION REASONABLE ATTORNEYS’ FEES, ARISING OUT OF OR IN ANY WAY CONNECTED WITH: a) YOUR ACCESS TO OR USE OF THE PLATFORM, AND/OR YOUR INABILITY TO ACCESS OR USE THE PLATFORM; b) YOUR BREACH OR ALLEGED BREACH OF THESE TERMS OR YOUR VIOLATION OF ANY OTHER PROVISION OF THESE TERMS, INCLUDING ANY TERMS INCORPORATED BY REFERENCE HEREIN; c) YOUR VIOLATION OF ANY LAW, RULE OR REGULATION; d) YOUR VIOLATION OF THE RIGHTS OF ANY THIRD-PARTY; e) RE-USE OF ANY CONTENT AT, OR OBTAINED FROM, THE PLATFORM OR ANY OTHER SOURCE WHATSOEVER; f) FACILITATING OR MAKING A PAYMENT INTO YOUR CUSTOMER ACCOUNT; g) PLAYING THE GAMES THROUGH ANY DELIVERY MECHANISM OFFERED; AND h) ACCEPTANCE AND USE OF ANY PRIZE OR THE INABILITY TO ACCEPT OR USE ANY PRIZE.
                            </p>
                            <p className="leading-relaxed mb-4 uppercase text-sm">
                                24.2. Limitation of Liability a) TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, UNDER NO CIRCUMSTANCES WHATSOEVER WILL WE OR OUR AFFILIATES, SUBSIDIARIES, ULTIMATE PARENT AND PARENT COMPANIES, PARTNERS, OFFICERS, DIRECTORS, EMPLOYEES, CONTRACTORS, SHAREHOLDERS, AGENTS, LICENSORS, SUBCONTRACTORS AND SUPPLIERS, BE RESPONSIBLE OR LIABLE TO YOU OR TO ANY OTHER ENTITY, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES, UNDER ANY LEGAL THEORY, WHETHER CONTRACT, TORT OR OTHERWISE: i) FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, EXEMPLARY, OR PUNITIVE DAMAGES, INCLUDING ANY LOST PROFITS AND LOST BUSINESS OPPORTUNITIES, BUSINESS INTERRUPTION, LOST REVENUE, INCOME, GOODWILL, USE OF DATA OR OTHER INTANGIBLE LOSSES, WHETHER ARISING OUT OF OR IN CONNECTION WITH OUR SITES, THE PLATFORM, YOUR CUSTOMER ACCOUNT(S), YOUR USE OF THE GAMES, THESE TERMS AND/OR ANY OTHER ACT OR OMISSION BY US. ii) FOR MORE THAN THE AMOUNT YOU HAVE PAID US IN THE THIRTY (30) DAYS IMMEDIATELY PRECEDING THE DATE ON WHICH YOU FIRST ASSERT ANY SUCH CLAIM PURSUANT TO CLAUSE 26 BELOW. YOU ACKNOWLEDGE AND AGREE THAT IF YOU HAVE NOT PAID US ANY AMOUNTS IN THE THIRTY (30) DAYS IMMEDIATELY PRECEDING THE DATE ON WHICH YOU FIRST ASSERT ANY SUCH CLAIM, YOUR SOLE AND EXCLUSIVE REMEDY FOR ANY DISPUTE WITH US IS TO STOP USING THE PLATFORM AND TO CLOSE YOUR CUSTOMER ACCOUNT.<br/>
                                b) YOU RECOGNIZE AND AGREE THAT THE WARRANTY DISCLAIMERS IN CLAUSES 19 AND 23, AND THE INDEMNITIES AND LIMITATIONS OF LIABILITY IN CLAUSE 24, ARE MATERIAL AND BARGAINED-FOR BASES OF THESE TERMS AND THAT THEY HAVE BEEN TAKEN INTO ACCOUNT AND REFLECTED IN THE DECISION BY YOU TO ENTER INTO THESE TERMS.
                            </p>
                            <p className="leading-relaxed mb-4">
                                c) We are not liable for any breach of these Terms where the breach is due to abnormal and unforeseeable circumstances beyond our control, the consequences of which would have been unavoidable despite all effects to the contrary, nor are we liable where the breach is due to any action or inaction which is necessary or desirable in order to comply with any laws, rules, or regulations.<br/>
                                d) Depending on where you reside and use the Platform, some of the limitations contained in clause 24 may not be permissible. In such case, they will not apply to you, solely to the extent so prohibited.<br/>
                                e) If you are a Customer who resides in the state of California, you waive your rights under California Civil Code § 1542, which provides: “A general release does not extend to claims that the creditor or releasing party does not know or suspect to exist in his or her favor at the time of executing the release and that, if known by him or her, would have materially affected his or her settlement with the debtor or released party.”
                            </p>
                            <p className="leading-relaxed mb-4 uppercase text-sm">
                                24.3. Negligence and Willful Misconduct NOTHING IN THESE TERMS WILL OPERATE SO AS TO EXCLUDE ANY LIABILITY OF PLAYFORGES FOR DEATH OR PERSONAL PHYSICAL INJURY THAT IS DIRECTLY AND PROXIMATELY CAUSED BY PLAYFORGES’S GROSS NEGLIGENCE OR WILFUL MISCONDUCT.<br/><br/>
                                24.4. Survival of Obligations THIS CLAUSE 24 (INDEMNITY AND LIMITATION OF LIABILITY) SURVIVES THE TERMINATION OF THESE TERMS FOR ANY REASON.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">25. PLAYFORGES NOT A FINANCIAL INSTITUTION</h2>
                            <p className="leading-relaxed mb-4">
                                25.1. You will not receive any interest on outstanding Prizes and you will not treat Playforges as a financial institution.<br/>
                                25.2. Playforges does not provide advice regarding tax and/or legal matters. Customers who wish to obtain advice regarding tax and legal matters are advised to contact appropriate advisors.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-white mb-4">26. DISPUTE RESOLUTION AND AGREEMENT TO ARBITRATE</h2>
                            <p className="leading-relaxed mb-4 uppercase text-sm">
                                26.1. PLEASE READ THIS CLAUSE 26 CAREFULLY AS IT REQUIRES YOU TO ARBITRATE DISPUTES AGAINST PLAYFORGES ON AN INDIVIDUAL BASIS AND LIMITS THE MANNER IN WHICH YOU CAN SEEK RELIEF FROM PLAYFORGES.
                            </p>
                            <p className="leading-relaxed mb-4">
                                26.2. This clause 26 (Dispute Resolution and Agreement to Arbitrate) shall be construed under and be subject to the Federal Arbitration Act.<br/>
                                26.3. By agreeing to these Terms, you agree that any and all past, present and future disputes, claims or causes of action between you and Playforges or any of its affiliates, subsidiaries, ultimate parent and parent companies, partners, officers, directors, employees, contractors, shareholders, agents, licensors, subcontractors or suppliers, which arise out of or are related in any way to these Terms, the formation of these Terms, the validity or scope of this clause 26 (Dispute Resolution and Agreement to Arbitrate), your Participation in or other use of the Platform or Games.
                            </p>
                        </section>

                    </div>
                </div>
            </div>
        </div>
    );
}
