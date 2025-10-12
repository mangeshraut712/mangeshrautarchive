# 🎯 **GitHub Pages Comprehensive Test Suite**

## 🚀 **Live Testing 10 Questions for OpenRouter + LinkedIn Integration**

### **📍 Site URL:** https://mangeshraut712.github.io/mangeshrautarchive

---

## 💡 **About Response Sources:**

Each response now shows the **specific model name** in the **source field**:
- `"source": "linkedin + openrouter (deepseek/deepseek-chat-v3-0324:free)"` → LinkedIn context + specific model
- `"source": "openrouter (openai/gpt-4o-mini:free)"` → Direct AI response + specific model
- `"source": "curated-fact (system status)"` → System info responses

---

## 📋 **Test Suite: 10 Comprehensive Questions**

### **Test Group 1: LinkedIn + OpenRouter (Enhanced Context)**

**1. Portfolio/Skills Related ( Linkedin Context + AI)**
```bash
curl -X POST https://mangeshraut712.github.io/mangeshrautarchive/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What experience does Mangesh have with AWS and machine learning?"}'
```
**Expected:** `"source": "linkedin + openrouter (deepseek/deepseek-chat-v3-0324:free)"` or other random model

*(Will show the specific model: `deepseek/deepseek-chat-v3-0324:free`, `openai/gpt-4o-mini:free`, or `meta-llama/llama-3.2-3b-instruct:free`)*

---

**2. Education Background (LinkedIn Context + AI)**
```bash
curl -X POST https://mangeshraut712.github.io/mangeshrautarchive/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Where did Mangesh study and what are his qualifications?"}'
```
**Expected:** `"source": "linkedin + openrouter (openai/gpt-4o-mini:free)"` or other random model

*(Specific model name will vary based on random selection)*

---

**3. Projects & Experience (LinkedIn Context + AI)**
```bash
curl -X POST https://mangeshraut712.github.io/mangeshrautarchive/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Can you tell me about Mangesh's work with Spring Boot and AngularJS?"}'
```
**Expected:** `"source": "linkedin + openrouter (meta-llama/llama-3.2-3b-instruct:free)"` or other random model

*(Model rotates between the 3 available: DeepSeek-V3, GPT-4o Mini, Llama 3.2)*

---

### **Test Group 2: Pure OpenRouter AI Responses**

**4. Technical Question (Direct AI)**
```bash
curl -X POST https://mangeshraut712.github.io/mangeshrautarchive/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Explain the difference between supervised and unsupervised machine learning?"}'
```
**Expected:** `"source": "openrouter (deepseek/deepseek-chat-v3-0324:free)"` or other specific model

---

**5. Programming Query (Direct AI)**
```bash
curl -X POST https://mangeshraut712.github.io/mangeshrautarchive/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"How do I implement a REST API in Java Spring Boot?"}'
```
**Expected:** `"source": "openrouter (openai/gpt-4o-mini:free)"` or other specific model

---

**6. Data Science Question (Direct AI)**
```bash
curl -X POST https://mangeshraut712.github.io/mangeshrautarchive/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What algorithms are commonly used for recommendation systems?"}'
```
**Expected:** `"source": "openrouter (meta-llama/llama-3.2-3b-instruct:free)"` or other specific model

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
**Expected:** `"source": "openrouter (deepseek/deepseek-chat-v3-0324:free)"` or other specific model

---

### **Test Group 4: Mathematics & Reasoning (OpenRouter)**

**9. Mathematical Reasoning (Direct AI)**
```bash
curl -X POST https://mangeshraut712.github.io/mangeshrautarchive/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Calculate compound interest: $1000 at 5% annual interest for 3 years."}'
```
**Expected:** `"source": "openrouter (openai/gpt-4o-mini:free)"` or other specific model

---

**10. Scientific Explanation (Direct AI)**
```bash
curl -X POST https://mangeshraut712.github.io/mangeshrautarchive/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Explain quantum entanglement using simple analogies."}'
```
**Expected:** `"source": "openrouter (meta-llama/llama-3.2-3b-instruct:free)"` or other specific model

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

# Note: The actual expected sources will include specific model names
# like "linkedin + openrouter (deepseek/deepseek-chat-v3-0324:free)"
# or "openrouter (openai/gpt-4o-mini:free)"
# The script above is for reference - actual results will vary due to random model selection

expected_sources=(
    "linkedin + openrouter (*)"  # * = any of the 3 models
    "linkedin + openrouter (*)"
    "linkedin + openrouter (*)"
    "openrouter (*)"  # * = any of the 3 models
    "openrouter (*)"
    "openrouter (*)"
    "curated-fact (system status)"
    "openrouter (*)"
    "openrouter (*)"
    "openrouter (*)"
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
