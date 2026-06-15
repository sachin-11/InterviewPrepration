# SOLID Principles — LLD Interview Guide
# Low Level Design mein SOLID ko Samjho aur Explain Karo

---

## SOLID Kya Hai? (30-second Elevator Pitch)

SOLID 5 design principles ka acronym hai jo object-oriented code ko:
- **Readable** — dusra developer easily samjhe
- **Maintainable** — ek jagah change karo, poora system na toote
- **Extensible** — naya feature add karo bina purana code chhede

```
S — Single Responsibility Principle
O — Open/Closed Principle
L — Liskov Substitution Principle
I — Interface Segregation Principle
D — Dependency Inversion Principle
```

> **Interview mein pehla sawaal:** "SOLID ka matlab kya hai aur kyun use karte hain?"
> **Answer:** "SOLID wo 5 principles hain jo ensure karte hain ki code change-friendly ho. Jab bhi requirement badle, minimal code change ho aur koi regression na aaye."

---

## S — Single Responsibility Principle (SRP)

### Definition
> **"Ek class ka sirf ek reason hona chahiye change hone ka."**
> — Robert C. Martin (Uncle Bob)

Simpler words mein: **Ek class = Ek kaam.**

### Bad Example (SRP Violation)
```typescript
// ❌ GALAT — UserService 3 alag responsibilities le raha hai
class UserService {
  // Responsibility 1: Business Logic
  createUser(data: UserDto): User {
    const user = new User(data);
    user.id = generateId();
    return user;
  }

  // Responsibility 2: Database Operation
  saveToDatabase(user: User): void {
    db.query(`INSERT INTO users VALUES (${user.id}, '${user.name}')`);
  }

  // Responsibility 3: Email Notification
  sendWelcomeEmail(user: User): void {
    emailClient.send({
      to: user.email,
      subject: "Welcome!",
      body: `Hello ${user.name}`,
    });
  }
}
```

**Problem:** Agar email template change ho, toh `UserService` ko touch karna padega.
Agar DB schema change ho, toh bhi `UserService` ko touch karna padega.
**2 alag reasons = SRP violation.**

### Good Example (SRP Follow)
```typescript
// ✅ SAHI — Har class ka ek kaam

class UserFactory {
  create(data: UserDto): User {
    const user = new User(data);
    user.id = generateId();
    return user;
  }
}

class UserRepository {
  save(user: User): void {
    db.query(`INSERT INTO users VALUES (?, ?)`, [user.id, user.name]);
  }
}

class EmailService {
  sendWelcome(user: User): void {
    emailClient.send({
      to: user.email,
      subject: "Welcome!",
      body: `Hello ${user.name}`,
    });
  }
}

// Orchestrator — sirf coordinate karta hai
class UserRegistrationService {
  constructor(
    private factory: UserFactory,
    private repo: UserRepository,
    private emailService: EmailService
  ) {}

  register(data: UserDto): User {
    const user = this.factory.create(data);
    this.repo.save(user);
    this.emailService.sendWelcome(user);
    return user;
  }
}
```

### Architecture Diagram
```
❌ SRP Violation:
┌──────────────────────────────────┐
│         UserService              │
│  - createUser()   ← Business     │
│  - saveToDb()     ← Database     │  ← 3 reasons to change
│  - sendEmail()    ← Notification │
└──────────────────────────────────┘

✅ SRP Applied:
┌───────────────┐   ┌──────────────────┐   ┌───────────────┐
│  UserFactory  │   │  UserRepository  │   │  EmailService │
│  - create()   │   │  - save()        │   │  - sendWelcome│
└───────┬───────┘   └────────┬─────────┘   └───────┬───────┘
        │                    │                      │
        └────────────────────┼──────────────────────┘
                             │
              ┌──────────────▼──────────────┐
              │   UserRegistrationService   │
              │   - register()              │
              └─────────────────────────────┘
```

### Interview Point
> "SRP ka fayda yeh hai ki jab email provider change karo (SendGrid se Mailgun), sirf `EmailService` badlo. `UserFactory` ya `UserRepository` ko chhuna nahi padega. Change isolation hoti hai."

---

## O — Open/Closed Principle (OCP)

### Definition
> **"Software entities open honi chahiye extension ke liye, lekin closed honi chahiye modification ke liye."**

Simpler words mein: **Naya feature add karo naya code likhkar, purana code mat chhuo.**

### Real-world Scenario
Payment system mein pehle sirf Credit Card tha. Phir UPI aaya, phir Crypto. Har baar `PaymentService` ka `if-else` mat badlo.

### Bad Example (OCP Violation)
```typescript
// ❌ GALAT — Har nayi payment method pe yeh file kholni padegi
class PaymentProcessor {
  process(amount: number, method: string): void {
    if (method === "credit_card") {
      console.log(`Charging credit card: ₹${amount}`);
      // Stripe API call
    } else if (method === "upi") {
      console.log(`UPI payment: ₹${amount}`);
      // Razorpay API call
    } else if (method === "crypto") {
      console.log(`Crypto payment: ₹${amount}`);
      // Coinbase API call
    }
    // Naya method aaya? Yahan aur ek else-if likhna padega ❌
  }
}
```

**Problem:** Har nayi payment method ke liye existing `PaymentProcessor` modify karna padega. Modification = risk of breaking existing flows.

### Good Example (OCP Follow)
```typescript
// ✅ SAHI — Extension ke liye open, modification ke liye closed

interface PaymentStrategy {
  process(amount: number): void;
}

class CreditCardPayment implements PaymentStrategy {
  process(amount: number): void {
    console.log(`Stripe: Charging ₹${amount} on credit card`);
  }
}

class UpiPayment implements PaymentStrategy {
  process(amount: number): void {
    console.log(`Razorpay: UPI payment of ₹${amount}`);
  }
}

class CryptoPayment implements PaymentStrategy {
  process(amount: number): void {
    console.log(`Coinbase: Crypto payment of ₹${amount}`);
  }
}

// Nayi payment method? Sirf naya class banao — PaymentProcessor mat chhuo!
class WalletPayment implements PaymentStrategy {
  process(amount: number): void {
    console.log(`Paytm Wallet: ₹${amount} deducted`);
  }
}

class PaymentProcessor {
  // Yeh class ab kabhi modify nahi hogi
  execute(strategy: PaymentStrategy, amount: number): void {
    strategy.process(amount);
  }
}

// Usage
const processor = new PaymentProcessor();
processor.execute(new UpiPayment(), 500);
processor.execute(new CryptoPayment(), 1000);
```

### Architecture Diagram
```
                  ┌──────────────────┐
                  │ «interface»      │
                  │ PaymentStrategy  │
                  │ + process()      │
                  └────────┬─────────┘
                           │ implements
          ┌────────────────┼────────────────┐
          │                │                │
┌─────────▼──────┐ ┌───────▼──────┐ ┌──────▼──────┐
│ CreditCard     │ │ UpiPayment   │ │ Crypto       │
│ Payment        │ │              │ │ Payment      │
└────────────────┘ └──────────────┘ └─────────────┘
          ▲ Naya class = Extension (purana code untouched)

┌─────────────────────┐
│  PaymentProcessor   │ ← Yeh class "Closed" hai modification ke liye
│  execute(strategy)  │
└─────────────────────┘
```

### Interview Point
> "OCP ka best real-world example Strategy Pattern hai. Jab bhi aapko runtime pe behavior switch karna ho (payment method, sorting algorithm, logging destination), Strategy Pattern + OCP lagao. `if-else` chain kabhi nahi banao."

---

## L — Liskov Substitution Principle (LSP)

### Definition
> **"Agar S, T ka subtype hai, toh T ke objects ko S ke objects se replace kar sako bina program ka behavior break kiye."**

Simpler words mein: **Child class ko parent class ki jagah use kar sako bina koi surprise ke.**

### Classic Bad Example (Rectangle-Square Problem)
```typescript
// ❌ GALAT — Square, Rectangle ka subtype ban raha hai lekin behavior break karta hai
class Rectangle {
  protected width: number = 0;
  protected height: number = 0;

  setWidth(w: number)  { this.width = w; }
  setHeight(h: number) { this.height = h; }
  area(): number       { return this.width * this.height; }
}

class Square extends Rectangle {
  // Square mein width === height hona chahiye
  setWidth(w: number)  { this.width = w;  this.height = w; } // ← side effect!
  setHeight(h: number) { this.height = h; this.width = h;  } // ← side effect!
}

// Test karo
function printArea(shape: Rectangle) {
  shape.setWidth(5);
  shape.setHeight(10);
  console.log(shape.area()); // Expected: 50
}

printArea(new Rectangle()); // ✅ 50
printArea(new Square());    // ❌ 100 — SURPRISE! LSP violation
```

**Problem:** `Square` ne `Rectangle` ka contract tod diya. `setWidth` aur `setHeight` independent hone chahiye the, lekin `Square` mein nahi hain.

### Good Example (LSP Follow)
```typescript
// ✅ SAHI — Shared abstraction, alag implementations

interface Shape {
  area(): number;
}

class Rectangle implements Shape {
  constructor(private width: number, private height: number) {}
  area(): number { return this.width * this.height; }
}

class Square implements Shape {
  constructor(private side: number) {}
  area(): number { return this.side * this.side; }
}

// Yeh function dono ke saath sahi kaam karta hai — LSP satisfied
function printArea(shape: Shape): void {
  console.log(`Area: ${shape.area()}`);
}

printArea(new Rectangle(5, 10)); // ✅ 50
printArea(new Square(5));        // ✅ 25
```

### Real-world Example (Notifications)
```typescript
// ❌ GALAT
class Notification {
  send(message: string): void {
    console.log(`Sending: ${message}`);
  }
}

class PushNotification extends Notification {
  send(message: string): void {
    if (!this.isDeviceOnline()) {
      throw new Error("Device offline!"); // ← Parent throw nahi karta tha!
    }
    super.send(message);
  }
  private isDeviceOnline(): boolean { return false; }
}

// ✅ SAHI
interface Notifier {
  send(message: string): boolean; // returns success/failure — koi throw nahi
}

class EmailNotifier implements Notifier {
  send(message: string): boolean {
    console.log(`Email: ${message}`);
    return true;
  }
}

class PushNotifier implements Notifier {
  send(message: string): boolean {
    if (!navigator.onLine) return false; // throw nahi, false return karo
    console.log(`Push: ${message}`);
    return true;
  }
}
```

### Interview Point
> "LSP violation ka sabse bada sign yeh hai ki child class mein koi method `throw new Error('Not Supported')` kare ya parent ke behavior ko silently change kare. Jab bhi aisa ho, inheritance mat use karo — composition use karo ya alag interface banao."

---

## I — Interface Segregation Principle (ISP)

### Definition
> **"Clients ko un methods pe depend nahi karna chahiye jo unhe use nahi karne."**

Simpler words mein: **Ek bada interface mat banao. Chhote-chhote specific interfaces banao.**

### Bad Example (ISP Violation)
```typescript
// ❌ GALAT — Ek "God Interface" jo sabko force karta hai sab implement karne pe
interface Worker {
  work(): void;
  eat(): void;
  sleep(): void;
  attendMeeting(): void;
}

class HumanWorker implements Worker {
  work()          { console.log("Working..."); }
  eat()           { console.log("Eating lunch..."); }
  sleep()         { console.log("Sleeping..."); }
  attendMeeting() { console.log("In meeting..."); }
}

class RobotWorker implements Worker {
  work()          { console.log("Robot working 24/7..."); }
  eat()           { throw new Error("Robots don't eat!"); }   // ❌ Forced!
  sleep()         { throw new Error("Robots don't sleep!"); } // ❌ Forced!
  attendMeeting() { console.log("Robot in meeting..."); }
}
```

**Problem:** `RobotWorker` ko `eat()` aur `sleep()` implement karne pe majboor kiya gaya jo usne nahi karna. ISP violation.

### Good Example (ISP Follow)
```typescript
// ✅ SAHI — Har interface ek specific capability ke liye

interface Workable {
  work(): void;
}

interface Feedable {
  eat(): void;
}

interface Restable {
  sleep(): void;
}

interface MeetingAttendee {
  attendMeeting(): void;
}

// Human sabkuch kar sakta hai
class HumanWorker implements Workable, Feedable, Restable, MeetingAttendee {
  work()          { console.log("Human working..."); }
  eat()           { console.log("Eating lunch..."); }
  sleep()         { console.log("Sleeping..."); }
  attendMeeting() { console.log("In meeting..."); }
}

// Robot sirf jo karna ho wo implement kare
class RobotWorker implements Workable, MeetingAttendee {
  work()          { console.log("Robot working 24/7..."); }
  attendMeeting() { console.log("Robot attending meeting..."); }
}
```

### Real-world Example (File Storage)
```typescript
// ❌ GALAT — Ek bada interface
interface FileStorage {
  read(path: string): Buffer;
  write(path: string, data: Buffer): void;
  delete(path: string): void;
  listFiles(dir: string): string[];
  compress(path: string): void;
  encrypt(path: string): void;
}

// ReadOnly storage ko write/delete implement karna padega
class ReadOnlyStorage implements FileStorage {
  read(path: string): Buffer { return fs.readFileSync(path); }
  write() { throw new Error("Read only!"); }   // ❌
  delete() { throw new Error("Read only!"); }  // ❌
  listFiles() { return []; }
  compress() { throw new Error("Not supported"); } // ❌
  encrypt()  { throw new Error("Not supported"); } // ❌
}

// ✅ SAHI
interface Readable  { read(path: string): Buffer; }
interface Writable  { write(path: string, data: Buffer): void; }
interface Deletable { delete(path: string): void; }
interface Listable  { listFiles(dir: string): string[]; }

class ReadOnlyStorage implements Readable, Listable {
  read(path: string): Buffer  { return fs.readFileSync(path); }
  listFiles(dir: string): string[] { return fs.readdirSync(dir); }
}

class FullStorage implements Readable, Writable, Deletable, Listable {
  read(path: string): Buffer           { return fs.readFileSync(path); }
  write(path: string, data: Buffer)    { fs.writeFileSync(path, data); }
  delete(path: string)                 { fs.unlinkSync(path); }
  listFiles(dir: string): string[]     { return fs.readdirSync(dir); }
}
```

### Interview Point
> "ISP ka real-world benefit yeh hai ki jab aap ek function likhte ho jo sirf read karta hai, uski dependency `Readable` honi chahiye — poora `FileStorage` nahi. Isse testing easy hoti hai (mock chhota hoga) aur accidental writes prevent hote hain."

---

## D — Dependency Inversion Principle (DIP)

### Definition
> **"High-level modules ko low-level modules pe depend nahi karna chahiye. Dono abstractions pe depend karein."**

Simpler words mein: **Class ke andar `new` mat karo. Bahar se inject karo.**

### Bad Example (DIP Violation)
```typescript
// ❌ GALAT — OrderService directly MySQL pe depend kar raha hai
class MySQLDatabase {
  save(order: Order): void {
    console.log(`MySQL: Saving order ${order.id}`);
  }
}

class OrderService {
  private db: MySQLDatabase;

  constructor() {
    this.db = new MySQLDatabase(); // ← TIGHT COUPLING! DIP violation
  }

  placeOrder(order: Order): void {
    // Business logic
    order.status = "confirmed";
    this.db.save(order); // ← MySQL se directly tied
  }
}
```

**Problem:** Kal agar MongoDB pe shift karna ho, toh `OrderService` ka constructor todna padega. Testing mein real MySQL chahiye hoga.

### Good Example (DIP Follow)
```typescript
// ✅ SAHI — Abstraction pe depend karo

// Abstraction (interface)
interface OrderRepository {
  save(order: Order): void;
  findById(id: string): Order | null;
}

// Low-level module 1
class MySQLOrderRepository implements OrderRepository {
  save(order: Order): void {
    console.log(`MySQL: Saving order ${order.id}`);
  }
  findById(id: string): Order | null {
    console.log(`MySQL: Finding order ${id}`);
    return null;
  }
}

// Low-level module 2
class MongoOrderRepository implements OrderRepository {
  save(order: Order): void {
    console.log(`MongoDB: Saving order ${order.id}`);
  }
  findById(id: string): Order | null {
    console.log(`MongoDB: Finding order ${id}`);
    return null;
  }
}

// High-level module — kisi bhi DB se kaam karta hai
class OrderService {
  constructor(private repo: OrderRepository) {} // ← Inject karo, new mat karo

  placeOrder(order: Order): void {
    order.status = "confirmed";
    this.repo.save(order);
  }
}

// Wiring (main / DI Container)
const mysqlRepo = new MySQLOrderRepository();
const orderService = new OrderService(mysqlRepo); // MySQL ke saath

// Kal MongoDB pe shift karna ho:
const mongoRepo = new MongoOrderRepository();
const orderService2 = new OrderService(mongoRepo); // OrderService touch nahi hua!

// Testing mein mock inject karo
class MockOrderRepository implements OrderRepository {
  private saved: Order[] = [];
  save(order: Order): void   { this.saved.push(order); }
  findById(id: string)       { return this.saved.find(o => o.id === id) || null; }
  getSaved(): Order[]        { return this.saved; }
}
```

### Architecture Diagram
```
❌ DIP Violation (Tight Coupling):
┌──────────────────┐         ┌───────────────────┐
│   OrderService   │────────▶│   MySQLDatabase   │
│  (High-level)    │  new!   │   (Low-level)     │
└──────────────────┘         └───────────────────┘

✅ DIP Applied (Loose Coupling):
┌──────────────────┐         ┌────────────────────┐
│   OrderService   │────────▶│ «interface»        │
│  (High-level)    │ depends │ OrderRepository    │
└──────────────────┘         └─────────┬──────────┘
                                       │ implements
                          ┌────────────┼────────────┐
                          │            │            │
               ┌──────────▼──┐  ┌──────▼───┐  ┌────▼──────┐
               │  MySQL      │  │  Mongo   │  │  Mock     │
               │  Repository │  │  Repo    │  │  (Tests)  │
               └─────────────┘  └──────────┘  └───────────┘
```

### Interview Point
> "DIP ka direct connection NestJS ke `@Injectable()` aur `@Inject()` decorators se hai. NestJS ka pura DI Container isi principle pe based hai. Jab interviewer poochhe 'NestJS mein Dependency Injection kaise kaam karta hai', toh DIP explain karo."

---

## SOLID + Design Patterns — Connection

```
┌─────────┬──────────────────────────────────┬─────────────────────────┐
│ Principle│ Common Pattern                   │ When to Use             │
├─────────┼──────────────────────────────────┼─────────────────────────┤
│ SRP     │ Facade, Service Layer            │ God class tod rahe ho   │
│ OCP     │ Strategy, Decorator, Plugin      │ if-else chain badh rahi│
│ LSP     │ Template Method, Composite       │ Inheritance use ho raha│
│ ISP     │ Role Interface, Adapter          │ Interface bada ho raha  │
│ DIP     │ DI Container, Factory, Abstract  │ new keyword andar hai   │
└─────────┴──────────────────────────────────┴─────────────────────────┘
```

---

## Interview Cheat Sheet — Ek Nazar Mein

```
S — Single Responsibility
    "Ek class ka ek kaam. Agar 'aur' lagana pade, SRP tod raha hai."
    Detect: Class name mein 'And' hai? (UserAndEmailService) → SPLIT KRO

O — Open/Closed
    "if-else ki jagah interface + new class."
    Detect: Naye feature ke liye existing method khol ke edit karna pada? → OCP tod raha hai

L — Liskov Substitution
    "Child class parent ki jagah use karo — koi surprise nahi aana chahiye."
    Detect: Child mein throw new Error("Not supported") hai? → LSP tod raha hai

I — Interface Segregation
    "Chhote interfaces. Client sirf jo use kare wo implement kare."
    Detect: Interface mein method hai jo implement karne wala use nahi karta? → SPLIT KRO

D — Dependency Inversion
    "Constructor mein new mat likho. Interface inject karo."
    Detect: Class ke andar new ConcreteClass() hai? → DIP tod raha hai
```

---

## Common Interview Questions & Answers

### Q1: "SOLID principles ka sabse practically important kaunsa hai?"
> **Answer:** DIP (Dependency Inversion) — kyunki yeh directly testability aur framework design (NestJS, Spring) se juda hai. Bina DIP ke unit testing almost impossible hoti hai.

### Q2: "SRP aur ISP mein kya difference hai?"
> **Answer:** SRP class ke baare mein baat karta hai — ek class ek responsibility. ISP interface ke baare mein — ek interface ek role. Dono milke ensure karte hain ki na class badi ho na interface.

### Q3: "Kya SOLID hamesha follow karna chahiye?"
> **Answer:** YAGNI (You Aren't Gonna Need It) bhi important hai. Chhote scripts ya throwaway code mein over-engineering mat karo. SOLID tab apply karo jab codebase grow karne wala ho aur team multiple log ho."

### Q4: "LSP violation kaise detect karte ho code review mein?"
> **Answer:** 3 red flags:
> 1. Child class mein parent ka method override hokar empty/throw kare
> 2. `instanceof` checks everywhere (`if (obj instanceof Square)`)
> 3. Preconditions child mein tighten ho, postconditions loosen ho

### Q5: "React/Node.js mein SOLID kaise apply karta hai?"
```
S → Custom hooks ek kaam kare (useAuth, useFetch alag alag)
O → Component props se behavior inject karo (renderItem, onPress)
L → Higher-order components parent behavior maintain karein
I → Props interface mein sirf jo component use kare wo pass karo
D → Services/APIs ko inject karo, component ke andar fetch mat karo
```

---

## Quick Revision — 5 Minutes Before Interview

```
SOLID = Code Change Ka Insurance Policy

S → Class mein "aur" nahi (UserService AND EmailService ❌)
O → Purana code band, naya code khula (Strategy Pattern)
L → Beta class maa ki jagah fit ho (koi surprise nahi)
I → Interface "ek kaam, ek role" (God Interface ❌)
D → "new" andar nahi, bahar se inject (Testing easy hogi)
```

---

*Last Updated: June 2026 | LLD Interview Preparation*
