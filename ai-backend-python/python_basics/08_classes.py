# ─────────────────────────────────────────────────────────────
# 08_classes.py — OOP / Classes
# ─────────────────────────────────────────────────────────────

# ── 1. Basic Class ────────────────────────────────────────────
# JS:
# class User {
#   constructor(name, role) {
#     this.name = name
#     this.role = role
#   }
# }

class User:
    def __init__(self, name: str, role: str = "user"):
        # __init__ = constructor
        # self = this in JS
        self.name = name
        self.role = role

    def greet(self) -> str:
        return f"Hi, I'm {self.name} ({self.role})"

    def is_admin(self) -> bool:
        return self.role == "admin"

# Create instance
u1 = User("Arjun", "admin")
u2 = User("Priya")           # role defaults to "user"

print(u1.greet())             # Hi, I'm Arjun (admin)
print(u2.greet())             # Hi, I'm Priya (user)
print(u1.is_admin())          # True
print(u2.is_admin())          # False

# ── 2. __str__ (= toString in JS) ────────────────────────────
class Product:
    def __init__(self, name: str, price: float):
        self.name  = name
        self.price = price

    def __str__(self) -> str:
        return f"Product({self.name}, ${self.price})"

    def __repr__(self) -> str:
        return f"Product(name={self.name!r}, price={self.price})"

p = Product("MacBook", 2499.0)
print(p)        # Product(MacBook, $2499.0)
print(repr(p))  # Product(name='MacBook', price=2499.0)

# ── 3. Class Variables vs Instance Variables ──────────────────
class Counter:
    count = 0   # class variable — shared across all instances

    def __init__(self, name: str):
        Counter.count += 1
        self.name = name   # instance variable — unique per instance
        self.id = Counter.count

c1 = Counter("first")
c2 = Counter("second")
c3 = Counter("third")

print(Counter.count)   # 3
print(c1.id)           # 1
print(c2.id)           # 2

# ── 4. Inheritance ────────────────────────────────────────────
# JS:  class AdminUser extends User
class AdminUser(User):
    def __init__(self, name: str, department: str):
        super().__init__(name, role="admin")   # super() = same as JS
        self.department = department

    def greet(self) -> str:
        base = super().greet()
        return f"{base} | Dept: {self.department}"

admin = AdminUser("Arjun", "Engineering")
print(admin.greet())      # Hi, I'm Arjun (admin) | Dept: Engineering
print(admin.is_admin())   # True (inherited)

# ── 5. @property (getter/setter) ─────────────────────────────
class BankAccount:
    def __init__(self, owner: str, balance: float = 0):
        self.owner = owner
        self._balance = balance   # _ prefix = private (convention)

    @property
    def balance(self) -> float:
        return self._balance

    @balance.setter
    def balance(self, amount: float):
        if amount < 0:
            raise ValueError("Balance cannot be negative")
        self._balance = amount

    def deposit(self, amount: float):
        self._balance += amount

    def withdraw(self, amount: float):
        if amount > self._balance:
            raise ValueError("Insufficient funds")
        self._balance -= amount

acc = BankAccount("Arjun", 1000)
print(acc.balance)    # 1000
acc.deposit(500)
print(acc.balance)    # 1500
acc.withdraw(200)
print(acc.balance)    # 1300

# ── 6. @staticmethod & @classmethod ──────────────────────────
class MathUtils:
    PI = 3.14159

    @staticmethod
    def add(a: int, b: int) -> int:
        """No self/cls — pure utility function"""
        return a + b

    @classmethod
    def circle_area(cls, radius: float) -> float:
        """cls = the class itself"""
        return cls.PI * radius ** 2

print(MathUtils.add(3, 5))           # 8
print(MathUtils.circle_area(7))      # 153.93...
