# TensorFlow & PyTorch Notes

## Introduction (Introduction)

TensorFlow aur PyTorch dono deep learning frameworks hain jo neural networks train karne ke liye use hote hain.

---

## TensorFlow

### Kya hai? (What is it?)
- Google ne develop kiya
- Open-source machine learning framework
- Production deployment ke liye best
- Static computation graph (originally), ab eager execution bhi support karta hai

### Key Features
- **Keras Integration**: High-level API for easy model building
- **TensorFlow Lite**: Mobile devices ke liye
- **TensorFlow Serving**: Production deployment ke liye
- **TF.js**: JavaScript mein ML
- **Distributed Training**: Large-scale training ke liye

### Installation
```bash
pip install tensorflow
```

### Basic Example
```python
import tensorflow as tf
from tensorflow import keras

# Simple neural network
model = keras.Sequential([
    keras.layers.Dense(64, activation='relu', input_shape=(784,)),
    keras.layers.Dropout(0.2),
    keras.layers.Dense(10, activation='softmax')
])

model.compile(
    optimizer='adam',
    loss='sparse_categorical_crossentropy',
    metrics=['accuracy']
)

# Training
# model.fit(x_train, y_train, epochs=5)
```

### TensorFlow Architecture
- **Tensors**: Multi-dimensional arrays (like NumPy arrays but with GPU support)
- **Graph**: Computational graph for operations
- **Session**: Execution environment (deprecated in TF 2.x)
- **Eager Execution**: Immediate execution (default in TF 2.x)

---

## PyTorch

### Kya hai? (What is it?)
- Facebook (Meta) ne develop kiya
- Open-source machine learning library
- Research community mein popular
- Dynamic computation graph (default)

### Key Features
- **Dynamic Graph**: Build graphs on-the-fly
- **Pythonic**: Normal Python jaisa feel
- **Debugging Friendly**: Python debugging tools use kar sakte ho
- **Research Preferred**: Academic papers mein mostly PyTorch use hota hai
- **TorchScript**: Production deployment ke liye

### Installation
```bash
pip install torch torchvision torchaudio
```

### Basic Example
```python
import torch
import torch.nn as nn
import torch.optim as optim

# Simple neural network
class SimpleNN(nn.Module):
    def __init__(self):
        super(SimpleNN, self).__init__()
        self.fc1 = nn.Linear(784, 64)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(64, 10)
        self.softmax = nn.Softmax(dim=1)
    
    def forward(self, x):
        x = self.fc1(x)
        x = self.relu(x)
        x = self.fc2(x)
        x = self.softmax(x)
        return x

model = SimpleNN()
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters())

# Training loop
# for epoch in range(epochs):
#     optimizer.zero_grad()
#     outputs = model(inputs)
#     loss = criterion(outputs, labels)
#     loss.backward()
#     optimizer.step()
```

### PyTorch Components
- **Tensors**: PyTorch ka main data structure
- **Autograd**: Automatic differentiation
- **nn Module**: Neural network layers
- **optim**: Optimization algorithms
- **DataLoader**: Data loading aur batching

---

## TensorFlow vs PyTorch Comparison

| Feature | TensorFlow | PyTorch |
|---------|-----------|---------|
| **Developer** | Google | Facebook (Meta) |
| **Graph Type** | Static (originally), now both | Dynamic (default) |
| **Learning Curve** | Steeper | Easier |
| **Debugging** | Harder | Easier (Pythonic) |
| **Deployment** | Excellent | Improving (TorchScript) |
| **Research** | Good | Excellent |
| **Industry Use** | High | Growing |
| **Community** | Large | Very Active |
| **Documentation** | Good | Excellent |

---

## Key Concepts (Important Concepts)

### 1. Tensors
Tensors are multi-dimensional arrays:
```python
# TensorFlow
import tensorflow as tf
tensor_tf = tf.constant([[1, 2], [3, 4]])

# PyTorch
import torch
tensor_py = torch.tensor([[1, 2], [3, 4]])
```

### 2. Computational Graph
- **Static Graph (TensorFlow 1.x)**: Pehle graph define karo, phir execute
- **Dynamic Graph (PyTorch)**: Runtime par graph build hota hai

### 3. Automatic Differentiation (Autograd)
- Gradients automatically calculate hota hain
- Backpropagation ke liye essential

```python
# PyTorch autograd example
x = torch.tensor(2.0, requires_grad=True)
y = x ** 3
y.backward()
print(x.grad)  # 12 (derivative of x^3 at x=2)
```

### 4. Neural Network Layers
Common layers:
- **Dense/Linear**: Fully connected layer
- **Conv2d**: Convolutional layer (images ke liye)
- **LSTM/GRU**: Recurrent layers (sequences ke liye)
- **Dropout**: Regularization
- **BatchNorm**: Normalization

---

## When to use which? (Kab use karein?)

### Use TensorFlow when:
- Production deployment karna hai
- Mobile apps mein ML chahiye
- Large-scale distributed training
- Web applications (TF.js)
- Existing TensorFlow ecosystem use karna hai

### Use PyTorch when:
- Research kar rahe ho
- Rapid prototyping chahiye
- Learning deep learning
- Academic papers reproduce karna hai
- Debugging easy chahiye

---

## Common Operations

### Data Loading
```python
# TensorFlow
dataset = tf.data.Dataset.from_tensor_slices((x, y))
dataset = dataset.batch(32).shuffle(1000)

# PyTorch
from torch.utils.data import DataLoader, TensorDataset
dataset = TensorDataset(x, y)
dataloader = DataLoader(dataset, batch_size=32, shuffle=True)
```

### GPU Support
```python
# TensorFlow
with tf.device('/GPU:0'):
    # GPU operations
    pass

# PyTorch
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = model.to(device)
inputs = inputs.to(device)
```

### Saving/Loading Models
```python
# TensorFlow
model.save('model.h5')
loaded_model = keras.models.load_model('model.h5')

# PyTorch
torch.save(model.state_dict(), 'model.pth')
model.load_state_dict(torch.load('model.pth'))
```

---

## Popular Pre-trained Models

### TensorFlow (Keras Applications)
- VGG16, VGG19
- ResNet50, ResNet101
- InceptionV3
- MobileNet
- EfficientNet

### PyTorch (torchvision)
- ResNet
- VGG
- AlexNet
- DenseNet
- GoogLeNet

```python
# TensorFlow
from tensorflow.keras.applications import ResNet50
model = ResNet50(weights='imagenet')

# PyTorch
import torchvision.models as models
model = models.resnet50(pretrained=True)
```

---

## Learning Resources

### TensorFlow
- Official Documentation: tensorflow.org
- TensorFlow Tutorials
- Keras Documentation

### PyTorch
- Official Documentation: pytorch.org
- PyTorch Tutorials
- Blitz Tutorial (beginners ke liye)

---

## Tips for Beginners

1. **Start with PyTorch** agar learning phase mein ho
2. **TensorFlow** agar production focus hai
3. **Dono try karo** - different approaches seekhne ke liye
4. **Practice with small projects** - MNIST, CIFAR-10 se start karo
5. **Math basics** - Linear algebra, calculus important hai
6. **Neural network concepts** - Backpropagation, gradients samjho

---

## Common Interview Questions

1. TensorFlow vs PyTorch difference?
2. Static vs Dynamic computation graph?
3. What is autograd?
4. How does backpropagation work?
5. What are tensors?
6. GPU vs CPU training?
7. Model deployment strategies?
8. Overfitting kaise prevent karte ho?
9. Regularization techniques?
10. Transfer learning kya hai?

---

## Summary

- **TensorFlow**: Production-ready, Google ka framework, deployment ke liye best
- **PyTorch**: Research-friendly, Facebook ka framework, learning ke liye best
- Dono powerful hain, use case ke hisaab se choose karo
- Deep learning mein tensors, gradients, neural networks samajhna zaroori hai
- Practice se hi expertise aayegi
