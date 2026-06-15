# Industry-Level Computer Networking: Simple Q&A Guide 🌐

Agar aap simple and direct answers chahte hain bina complex tables aur diagrams ke, toh ye sheet bilkul straightforward hai. Har topic ka clear description aur direct answer yahan diya gaya hai:

---

## 1. HTTP/1.1 vs HTTP/2 vs HTTP/3 🚀
* **HTTP/1.1**:
  * **Kya hai?** Purana web protocol jisme data ek-ek karke sequential transfer hota hai.
  * **Issue:** Head-of-Line (HoL) blocking hoti hai. Agar line mein pehla request slow hai, toh baaki saare requests queue mein ruk jaate hain.
* **HTTP/2**:
  * **Kya hai?** Naya protocol jo ek single TCP connection par multiple streams (files/requests) ek saath bhejta hai (Multiplexing).
  * **Issue:** Agar internet stable nahi hai aur ek bhi packet loss hota hai, toh TCP level par saara data ruk jaata hai.
* **HTTP/3**:
  * **Kya hai?** Sabse modern protocol jo **TCP ke bajaye UDP** (using QUIC protocol) par chalta hai.
  * **Fayda:** Sabse fast hai. Agar ek packet drop bhi ho jaye, toh doosre packets bina ruke aate rehte hain (No Head-of-Line blocking). Connection setup sirf 0-1 RTT mein ho jata hai.

---

## 2. WebSockets vs WebRTC 🎙️
* **WebSockets**:
  * **Kya hai?** TCP-based persistent full-duplex connection.
  * **Simple Answer:** Client aur Server ke beech mein direct, constant text/data flow ke liye hota hai.
  * **Use Case:** Live chat applications, real-time trading dashboards, OpenAI Realtime text events.
* **WebRTC**:
  * **Kya hai?** UDP-based peer-to-peer (P2P) communication protocol.
  * **Simple Answer:** Client-to-client ya client-to-server ultra-low latency voice/video and raw media stream karne ke liye hota hai.
  * **Use Case:** Google Meet/Zoom, Gemini Multimodal Live voice call agents (<100ms latency).

---

## 3. gRPC vs REST APIs 🔌
* **REST APIs**:
  * **Kya hai?** JSON format mein text data transfer karne ka tarika.
  * **Simple Answer:** Ye readable hota hai par iski payload size badi hoti hai aur parse karne mein CPU resources zyada lagte hain.
  * **Use Case:** Public APIs jo web/mobile apps consume karte hain.
* **gRPC (Google Remote Procedure Call)**:
  * **Kya hai?** Protocol Buffers (Protobuf) ka use karke data ko **highly compressed binary form** mein bhejta hai over HTTP/2.
  * **Simple Answer:** Ye JSON se 10x fast aur lightweight hota hai.
  * **Use Case:** Internally microservices ke aapas ke communication (East-West traffic) ke liye standard hai.

---

## 4. Layer 4 vs Layer 7 Load Balancing ⚖️
* **Layer 4 Load Balancer (TCP/UDP level)**:
  * **Kya hai?** Ye sirf IP address aur Port number dekh kar traffic redirect kar deta hai. Ye request ke andar ka content nahi padhta.
  * **Simple Answer:** Bahut fast hota hai aur CPU resource kam consume karta hai kyunki ye SSL decrypt nahi karta (e.g., AWS NLB).
* **Layer 7 Load Balancer (Application/HTTP level)**:
  * **Kya hai?** Ye HTTP headers, paths, cookies, aur query params ko read kar sakta hai aur SSL traffic decrypt karta hai.
  * **Simple Answer:** Smart routing kar sakta hai (jaise `/users` ko alag server pe bhejna aur `/payments` ko alag server pe) par thoda slow hota hai (e.g., Nginx, AWS ALB).

---

## 5. Forward Proxy vs Reverse Proxy 🛡️
* **Forward Proxy**:
  * **Simple Answer:** Ye **Client (User) ke aage** baithta hai. Ye user ki identity chupati hai aur outbound traffic ko control/restrict karti hai (jaise offices mein kuch websites block karna).
* **Reverse Proxy**:
  * **Simple Answer:** Ye **Servers ke aage** baithta hai. Ye backend servers ko safe rakhta hai. Ye client requests ko receive karta hai, TLS/SSL handle karta hai, cache manage karta hai aur standard servers par traffic load distribute karta hai (e.g., Nginx in front of Python FastAPI app).

---

## 6. TLS 1.3 Handshake (HTTPS Security) 🔒
* **TLS Handshake Kya hai?** Browser jab kisi secure server (`https`) se connect hota hai, toh connection encrypt karne ki symmetric key generate karne ka process.
* **Simple Explanation:** 
  1. **Asymmetric Encryption** (jisme Private/Public key hoti hai) ka use sirf handshake mein kiya jata hai taaki client aur server bina kisi ke intercept kiye ek **Symmetric Key** exchange kar sakein.
  2. Ek baar key exchange ho gayi, toh actual data transfer **Symmetric Encryption** se hota hai jo ki extremely fast hai. TLS 1.3 mein ye pura kaam sirf **1 RTT (Round Trip Time)** mein complete ho jata hai.

---

## 7. VPC, Subnets aur CIDR Cloud Basics ☁️
* **VPC (Virtual Private Cloud)**:
  * **Simple Answer:** Cloud (jaise AWS) ke andar aapka isolated, secured private network network bubble.
* **Public Subnet**:
  * **Simple Answer:** VPC ka wo hissa jo directly Internet Gateway se connected hai. Isme direct bahar se public IPs ke through traffic aa sakta hai (e.g., Load Balancers).
* **Private Subnet**:
  * **Simple Answer:** VPC ka wo protected hissa jo internet se isolated hai. Isme backend servers aur databases hote hain. Bahar se isme koi direct access nahi ho sakta.
* **CIDR Notation**:
  * **Simple Answer:** IP address range allocate karne ka format.
  * *Example:* `/16` (jaise `10.0.0.0/16`) bada area hai jisme 65,000+ IPs hote hain. `/24` (jaise `10.0.1.0/24`) chota segment hai jisme 256 IPs hote hain jo subnets ke liye standard hai.
