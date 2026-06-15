# 🏦 Fintech & Payment Gateway System Design

Fintech system design sabse complex aur interesting architectures mein se ek hai. Yahan aapka database ek second ke liye bhi galat data show nahi kar sakta (No eventual consistency for balances). "Ek paisa bhi idhar se udhar hua toh bawal ho jayega."

Is guide mein hum Fintech architecture, Payment flows (Stripe, ACH, UPI, Razorpay) aur common bottlenecks ko deep dive karenge.

---

## 1. The Core Principles of Fintech (The Non-Negotiables)

Fintech system design karte waqt aapko in 3 rules ka palan karna hi hota hai:

1. **Idempotency (Double Charge Problem):** Agar network fail ho jaye aur user do baar "Pay" button daba de, toh uske account se do baar paise nahi katne chahiye. Har request ke sath ek unique `idempotency_key` (jaise UUID) bheji jati hai. System pehle DB mein check karta hai: "Kya main is key ko pehle process kar chuka hoon?" Agar haan, toh wo naya transaction nahi banata.
2. **ACID Transactions & Strict Consistency:** Jab paisa transfer hota hai (A se paise kate, B mein add hue), toh ye dono kaam ek single Database Transaction mein hone chahiye (All or Nothing). No eventual consistency allowed for account balances.
3. **Double-Entry Accounting:** Fintech DB mein balance update seedha `UPDATE users SET balance = 500` karke nahi hota. Usme ek ledger table hoti hai jisme har credit aur debit ki entry hoti hai. Balance is calculated by `SUM(credits) - SUM(debits)`. Ise audit trail kehte hain.

---

## 2. Deep Dive: Payment Methods & Flows

Jab hum payment karte hain, toh background mein money flow kaise hota hai? Chaliye alag-alag systems ko samajhte hain:

### A. Stripe (Card Processing)
Stripe mainly ek Payment Gateway aur Processor hai (Global market ke liye).
- **Flow:**
  1. User card details enter karta hai (ye frontend seedha Stripe ke server par jata hai, aapke server par nahi, kyunki aapke paas PCI-DSS compliance nahi hai).
  2. Stripe ek `Token` return karta hai.
  3. Aapka frontend wo Token aapke backend ko bhejta hai.
  4. Aapka backend Stripe API ko Token + Amount ke sath hit karta hai (`POST /v1/charges`).
  5. Stripe payment process karta hai aur ek "Pending" ya "Success" response deta hai.
  6. **Webhook (Crucial):** Stripe aapke backend ke ek URL (Webhook) par ek event bhejta hai (`payment_intent.succeeded`) yeh confirm karne ke liye ki payment successful ho gayi hai.

### B. ACH (Automated Clearing House - US Bank Transfers)
ACH USA mein bank-to-bank transfer ka system hai. Ye real-time nahi hota, balki "Batch Processing" par chalta hai.
- **Flow:**
  1. Aap din bhar mein 10,000 transactions record karte hain.
  2. Raat ko sabhi banks ek file banate hain (Nacha file format) aur ACH network (FedACH ya EPN) ko bhej dete hain.
  3. Agle din (T+1 ya T+2 days), ACH network un transactions ko settle karta hai aur paisa ek bank se dusre bank jata hai.
- **System Design Point:** Yahan aapka system Asynchronous hona chahiye. Aap user ko turant "Success" nahi dikha sakte, sirf "Processing" dikhate hain jab tak bank se webhook na aaye (2-3 din baad).

### C. Razorpay (Payment Aggregator in India)
Razorpay Stripe jaisa hi hai, lekin ye India-specific complex payment methods (Net Banking, Cards, Wallets, UPI) ko ek jagah "Aggregate" karta hai.
- **Flow:** 
  Razorpay ka flow Stripe jaisa hi Token aur Webhook base par kaam karta hai. Lekin isme **Dynamic Routing** ka bada role hota hai. Agar Razorpay ko pata lagta hai ki HDFC ka server down chal raha hai, toh wo card payment ko dusre acquiring bank (jaise ICICI) ke gateway se route kar dega taaki success rate high rahe. Isko **Smart Routing** kehte hain.

### D. UPI (Unified Payments Interface - India)
UPI real-time instant payment system hai jo NPCI (National Payments Corporation of India) manage karta hai. Ye P2P (Person-to-Person) aur P2M (Person-to-Merchant) dono karta hai.
- **Flow:**
  1. User apne app (PhonePe/GPay) mein VPA (Virtual Payment Address - e.g., `sachin@okicici`) aur PIN dalta hai.
  2. PhonePe (PSP - Payment Service Provider) request ko NPCI ko bhejta hai.
  3. NPCI us request ko Remitter Bank (aapka bank) ko bhejta hai. Bank account check karta hai aur paise hold karta hai.
  4. NPCI uske baad Beneficiary Bank (dost ka bank) ko bhejta hai aur wahan paise credit hote hain.
  5. Pura process synchronous hota hai aur < 2 seconds mein complete hota hai.
- **System Design Point:** UPI mein **Timeouts** sabse bada issue hota hai. Agar 30 second mein bank ne response nahi diya, toh transaction "Pending" status mein chali jati hai, jiske liye background reconciliation jobs (Cron jobs) banani padti hain jo NPCI/Banks se status check karti hain (e.g., T+1 settlement).

---

## 3. Fintech System Design: Common Bottlenecks (Kahan System Fasta Hai?)

Ek Fintech engineer in 4 problems ke sath roz deal karta hai:

### Bottleneck 1: Race Conditions (Double Spending)
**Problem:** User ke paas ₹100 hain. Usne ek sath do tabs se ₹100 nikalne ki request ki. Agar DB check dono tab pe ek sath hua, toh wo ₹200 nikal lega!
**Fix:** 
- **Database Locks (Pessimistic Locking):** Jab ek request balance update kar rahi hoti hai, toh hum SQL query mein `SELECT * FROM accounts WHERE id = 1 FOR UPDATE;` lagate hain. Ye us row ko lock kar deta hai. Dusri request ko pehli request ke pura hone (ya fail hone) tak wait karna padega.

### Bottleneck 2: 3rd Party API Timeouts
**Problem:** Aapne Bank ke API ko call kiya, lekin bank ka server down hai ya timeout ho gaya. Ab aapko nahi pata ki paise bank tak pahuche ya nahi.
**Fix:** 
- **Idempotency + Retries + Exponential Backoff:** Aap same idempotency key ke sath request ko dobara retry karenge.
- **Circuit Breaker Pattern:** Agar bank lagatar fail ho raha hai, toh system aage requests bhejna band kar dega aur sidha user ko "Bank is down" dikhayega, taaki aapke apne server ke resources exhaust na hon.

### Bottleneck 3: Background Reconciliation (The Silent Hero)
**Problem:** Aapke system mein likha hai ki Razorpay ne ₹10,000 collect kiye, par bank aakar bolta hai mere paas sirf ₹9,000 aaye hain.
**Fix:** 
- **Reconciliation Service:** Ek separate microservice (aur Cron job) hoti hai jo roz raat ko aapke local DB ke transactions ko Bank/Gateway (Stripe/Razorpay) ki settlement report (.csv ya API) se match karti hai. Jo transactions match nahi hote, unhe "Discrepancy" queue mein dal deti hai human review ke liye.

### Bottleneck 4: Webhooks Drop Ya Delay Hona
**Problem:** Stripe/UPI se payment ho gayi, user ke account se paise kat gaye, par aapka server Webhook catch karna miss kar gaya (server restart/crash). User aapki website par "Payment Failed" dekh raha hai!
**Fix:**
- **Asynchronous Webhook Processing:** Webhooks ko sidha API server mein process na karein. Pehle unko Kafka/RabbitMQ ya AWS SQS queue mein dalein. Phir ek worker process unhe aaram se DB mein save kare.
- **Polling Fallback:** Agar Webhook 5 minute tak na aaye, toh ek CRON job ko forcefully Stripe API ko GET call karke transaction ka status verify karna chahiye.

---

## 💡 Summary for Interviews
Agar interview mein "Design a Payment Gateway / Fintech App" pucha jaye, toh in keywords ko zaroor mention karein:
1. **Idempotency Keys** (Double charge rokne ke liye)
2. **Pessimistic Locking (`SELECT FOR UPDATE`)** (Double spending rokne ke liye)
3. **Double-Entry Ledger** (Balance calculate karne ke liye)
4. **SAGA Pattern / Two-Phase Commit** (Agar wallet se paise kat gaye aur order place nahi hua)
5. **Reconciliation Cron Jobs** (Bank files match karne ke liye)
6. **Circuit Breakers** (Bank down hone par system bachaane ke liye)
