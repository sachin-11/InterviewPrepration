# 🚀 Microservices Database Patterns: How Separate Databases Communicate

Jab hum monolithic architecture se microservices par aate hain, toh sabse bada rule hota hai: **"Database per Service"**. Yani User Service ka apna alag database hoga, aur Order Service ka apna alag database hoga.

**Problem:** Ab hum traditional SQL `JOIN` ya `FOREIGN KEY` use nahi kar sakte kyunki data do alag-alag machines/databases mein pada hai.

Is problem ko solve karne ke liye hum 3 main patterns ka use karte hain. Chaliye inhe step-by-step samajhte hain.

---

## 1. Data Jodna Kaise Hai? (Alternatives to SQL JOIN)

Maan lijiye aapko apne UI par dikhana hai: *"Sachin ne 1 Pizza order kiya"*.
Aapke paas do services hain:
- **User Service:** Jiske DB mein user ka naam (Sachin) hai.
- **Order Service:** Jiske DB mein order ki detail (Pizza) hai.

Ab in dono ko join kaise karein? Iske 2 tarike hain:

### A. API Composition Pattern (Simple but Slow at Scale)
Isme hum ek nayi service banate hain jise "API Gateway" ya "Aggregator" kehte hain. Ye aggregator dono services ko ek-ek karke call karta hai aur data memory mein merge karta hai.

**Steps:**
1. Frontend API Gateway ko call karta hai: `GET /order-details/123`
2. API Gateway pehle **Order Service** ko call karta hai aur order details laata hai (yahan use `user_id = 99` milta hai).
3. Phir API Gateway **User Service** ko call karta hai `GET /users/99` aur user ka naam ("Sachin") laata hai.
4. API Gateway dono data ko combine karke frontend ko bhej deta hai.

**Pros:** Implement karna aasan hai.
**Cons:** Agar 10 services ka data chahiye toh 10 network calls lagengi (jise N+1 query problem kehte hain), jo slow ho sakta hai.

### B. CQRS / Materialized View Pattern (Fast and Scalable)
CQRS ka matlab hai Command (Write) aur Query (Read) ko alag karna. Isme hum **Event-Driven Architecture (Kafka)** ka use karte hain.

Isme hum **Data Denormalization** karte hain, yani ek service ka data dusri service apne paas copy karke rakh leti hai.

**Steps:**
1. Jab naya user register hota hai (Name: Sachin), toh **User Service** apne DB mein data save karti hai aur ek event (message) publish karti hai Kafka broker par: `"UserCreated: {id: 99, name: 'Sachin'}"`.
2. **Order Service** is Kafka topic ko listen (subscribe) kar rahi hoti hai. Jaise hi usko event milta hai, wo Sachin ka naam apni ek local table mein save kar leti hai.
3. Ab jab Sachin pizza order karta hai, toh Order Service ko User Service se puchne ki zaroorat hi nahi hai! Uske apne Order DB mein hi Sachin ka naam available hai.
4. Aap sidha Order DB mein ek query marte hain aur aapko User ka naam aur Order details dono ek saath mil jaate hain.

**Pros:** Reads bohot fast hote hain kyunki sab data ek hi DB mein mil jata hai. Heavy load ke liye best hai.
**Cons:** Data thodi der ke liye out-of-sync (Eventually Consistent) ho sakta hai. Architecture complex ho jata hai.

---

## 2. Distributed Transactions (SAGA Pattern)

Jab DB ek hota tha, tab ACID transactions hote the. Agar aapne paisa bheja aur samne wale ko nahi mila, toh aapka paisa wapas aa jata tha (Rollback).
Lekin jab User DB, Order DB aur Payment DB sab alag hain, toh simple SQL `ROLLBACK` kaam nahi aata.

Iske liye hum **SAGA Pattern** use karte hain. SAGA ek sequence of local transactions hota hai. Agar koi step fail ho jaye, toh SAGA pichle saare successful steps ko reverse (undo) karne ke liye **Compensating Transactions** chalata hai.

### Example Scenario: E-commerce Order
Maan lo Sachin ne order place kiya. Teen services involve hain: `Order Service`, `Inventory Service`, `Payment Service`.

**Happy Path (Sab Sahi Chala):**
1. **Order Service:** Naya order banati hai `(Status: PENDING)` aur Kafka pe event fire karti hai: `OrderCreated`.
2. **Inventory Service:** Event pakadti hai, item ko minus (reserve) karti hai, aur event fire karti hai: `InventoryReserved`.
3. **Payment Service:** Event pakadti hai, Sachin ke account se paise kat-ti hai, aur event fire karti hai: `PaymentSuccessful`.
4. **Order Service:** Akhir mein status ko `APPROVED` kar deti hai.

**Failure Path (Compensation - Reverse Action):**
Maan lijiye Step 1 aur 2 sahi se ho gaye, lekin Step 3 mein Payment decline ho gayi (Bank server down hai).
1. **Payment Service:** Paisa nahi katta aur ye event fire karti hai: `PaymentFailed`.
2. **Inventory Service (Compensating Transaction):** Ye `PaymentFailed` event ko pakadti hai. Isko pata lagta hai order fail ho gaya hai. Toh jo item isne minus kiya tha, usko wapas **plus (add)** kar deti hai apne DB mein.
3. **Order Service (Compensating Transaction):** Ye order ka status `PENDING` se change karke `CANCELLED` kar deti hai.

Is tarah bina SQL Rollback ke bhi pura system consistent (sahi state mein) aa jata hai.

### SAGA ke do types hote hain:
1. **Choreography:** Har service apna event publish karti hai aur dusri services apne aap usko sun kar react karti hain. (Jaise upar wala example. Chote systems ke liye acha hai).
2. **Orchestration:** Ek alag se "Manager/Orchestrator Service" hoti hai (jaise AWS Step Functions ya Temporal). Ye manager sab services ko batata hai ki "Order Service tum ye karo, Payment tum ye karo". Agar fail hua toh manager hi sabko reverse karne ko bolta hai. (Complex aur bade systems ke liye best hai).

---

## Summary
Jab Interviewer aapse Microservices Data aur Scaling ke baare mein puche, toh aapka jawab is flow mein hona chahiye:
1. Main har service ka apna alag DB banaunga (Database per Service).
2. Data join karne ke liye main **CQRS (Kafka Events)** ka use karunga taki reads fast rahein.
3. Multi-database updates (transactions) ke liye main **SAGA Pattern (Orchestration/Choreography)** implement karunga jisme compensating transactions hongi.
