# 🎯 **GitHub Pages Comprehensive Test Suite**

## 🚀 **Live Testing 10 Questions for OpenRouter + LinkedIn Integration**

### **📍 Site URL:** https://mangeshraut712.github.io/mangeshrautarchive

---

## 💡 **About Response Sources:**

Each response should show the model name in the **source field**:
- `"source": "linkedin + openrouter modification"` → Uses LinkedIn contextual data
- `"source": "openrouter"` → Direct AI response from OpenRouter
- **Model name** will be shown when asking "what model" questions

---

## 📋 **Test Suite: 10 Comprehensive Questions**

### **Test Group 1: LinkedIn + OpenRouter (Enhanced Context)**

**1. Portfolio/Skills Related ( Linkedin Context + AI)**
```bash
curl -X POST https://mangeshraut712.github.io/mangeshrautarchive/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What experience does Mangesh have with AWS and machine learning?"}'
```
**Expected:** `"source": "linkedin + openrouter modification"`

---

**2. Education Background (LinkedIn Context + AI)**
```bash
curl -X POST https://mangeshraut712.github.io/mangeshrautarchive/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Where did Mangesh study and what are his qualifications?"}'
```
**Expected:** `"source": "linkedin + openrouter modification"`

---

**3. Projects & Experience (LinkedIn Context + AI)**
```bash
curl -X POST https://mangeshraut712.github.io/mangeshrautarchive/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Can you tell me about Mangesh's work with Spring Boot and AngularJS?"}'
```
**Expected:** `"source": "linkedin + openrouter modification"`

---

### **Test Group 2: Pure OpenRouter AI Responses**

**4. Technical Question (Direct AI)**
```bash
curl -X POST https://mangeshraut712.github.io/mangeshrautarchive/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Explain the difference between supervised and unsupervised machine learning?"}'
```
**Expected:** `"source": "openrouter"`

---

**5. Programming Query (Direct AI)**
```bash
curl -X POST https://mangeshraut712.github.io/mangeshrautarchive/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"How do I implement a REST API in Java Spring Boot?"}'
```
**Expected:** `"source": "openrouter"`

---

**6. Data Science Question (Direct AI)**
```bash
curl -X POST https://mangeshraut712.github.io/mangeshrautarchive/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What algorithms are commonly used for recommendation systems?"}'
```
**Expected:** `"source": "openrouter"`

---

### **Test Group 3: Model Information (Both Sources)**

**7. Current Model Status (Direct Answer)**
```bash
curl -X POST https://mangeshraut712.github.io/mangeshrautarchive/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Which model are you currently using?"}'
```
**Expected:** `"source": "curated-fact (system status)"`
**Should show:** "random model selection from DeepSeek-V3, GPT-4o Mini, and Llama 3.2 3B"

---

**8. Model Capabilities (Direct AI)**
```bash
curl -X POST https://mangeshraut712.github.io/mangeshrautarchive/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What are the benefits of using multiple AI models in a system?"}'
```
**Expected:** `"source": "openrouter"`

---

### **Test Group 4: Mathematics & Reasoning (OpenRouter)**

**9. Mathematical Reasoning (Direct AI)**
```bash
curl -X POST https://mangeshraut712.github.io/mangeshrautarchive/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Calculate compound interest: $1000 at 5% annual interest for 3 years."}'
```
**Expected:** `"source": "openrouter"`

---

**10. Scientific Explanation (Direct AI)**
```bash
curl -X POST https://mangeshraut712.github.io/mangeshrautarchive/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Explain quantum entanglement using simple analogies."}'
```
**Expected:** `"source": "openrouter"`

---

## 🔄 **Test Cycle: Random Model Distribution**

**Run this multiple times to see model rotation:**
```bash
# Test the same question 5 times to see different models
for i in {1..5}; do
  echo "=== Test $i ==="
  curl -s https://mangeshraut712.github.io/mangeshrautarchive/api/chat \
    -H "Content-Type: application/json" \
    -d '{"message":"What is 15 × 12?"}' | jq -r '.source'
  echo
done
```

---

## 📊 **Expected Response Analysis**

### **Successful LinkedIn + OpenRouter Integration:**
```json
{
  "answer": "Mangesh Raut has extensive experience with AWS and machine learning, having worked on AI-powered energy analytics and cloud automation systems. His background includes developing machine learning models using TensorFlow and deploying them on AWS infrastructure...",
  "source": "linkedin + openrouter modification",
  "type": "portfolio",
  "confidence": 0.93,
  "providers": ["openrouter"],
  "processingTime": 1452
}
```

### **Successful Pure OpenRouter Response:**
```json
{
  "answer": "Supervised machine learning uses labeled training data to learn patterns, while unsupervised machine learning finds hidden patterns in unlabeled data. Examples include:",
  "source": "openrouter",
  "type": "technical",
  "confidence": 0.87,
  "providers": ["openrouter"],
  "processingTime": 1234
}
```

### **Model Selection Response:**
```json
{
  "answer": "I am currently running on OpenRouter using random model selection from our top 3 models: DeepSeek-V3, GPT-4o Mini, and Llama 3.2 3B Instruct.",
  "source": "curated-fact (system status)",
  "type": "general",
  "confidence": 0.98,
  "providers": ["curated"],
  "processingTime": 5
}
```

---

## 🎯 **Pass/Fail Criteria**

### ✅ **Test Passes If:**
- [x] `source` field shows correct value for each question type
- [x] Response time under 5 seconds
- [x] No 500 errors or offline fallback responses
- [x] Content is relevant and contextual
- [x] LinkedIn questions include portfolio details

### ❌ **Test Fails If:**
- [ ] Wrong source type (e.g., "offline-knowledge")
- [ ] 401/403 API errors
- [ ] Response time > 10 seconds
- [ ] Generic fallback messages
- [ ] No portfolio context in LinkedIn questions

---

## 🚀 **Quick Test Script**

```bash
#!/bin/bash
# Run this script to test all 10 questions

echo "🧪 GitHub Pages Comprehensive Test Suite"
echo "============================================="

questions=(
    "What experience does Mangesh have with AWS and machine learning?"
    "Where did Mangesh study and what are his qualifications?"
    "Can you tell me about Mangesh's work with Spring Boot and AngularJS?"
    "Explain the difference between supervised and unsupervised machine learning?"
    "How do I implement a REST API in Java Spring Boot?"
    "What algorithms are commonly used for recommendation systems?"
    "Which model are you currently using?"
    "What are the benefits of using multiple AI models in a system?"
    "Calculate compound interest: $1000 at 5% annual interest for 3 years."
    "Explain quantum entanglement using simple analogies."
)

expected_sources=(
    "linkedin + openrouter modification"
    "linkedin + openrouter modification"
    "linkedin + openrouter modification"
    "openrouter"
    "openrouter"
    "openrouter"
    "curated-fact (system status)"
    "openrouter"
    "openrouter"
    "openrouter"
)

for i in ${!questions[@]}; do
    echo "Test $((i+1)): ${questions[$i]:0:50}..."
    result=$(curl -s "https://mangeshraut712.github.io/mangeshrautarchive/api/chat" \
        -H "Content-Type: application/json" \
        -d "{\"message\":\"${questions[$i]}\"}")
    actual_source=$(echo $result | jq -r '.source' 2>/dev/null || echo "ERROR")

    if [ "$actual_source" = "${expected_sources[$i]}" ]; then
        echo "✅ PASS - Source: $actual_source"
    else
        echo "❌ FAIL - Expected: ${expected_sources[$i]}, Got: $actual_source"
    fi
    echo
done
```

---

## 📈 **Performance Metrics**

**Response Time Benchmarks:**
- LinkedIn questions: < 2 seconds
- Technical questions: < 1.5 seconds
- Math questions: < 1 second
- Model queries: < 0.1 seconds

**Success Rate Target:** 100% (no offline fallback responses)

---

Run these tests and share the results! Each test should demonstrate the specific integration working correctly with the right source attribution. 🎯
