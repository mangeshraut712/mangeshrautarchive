/**
 * Blog Data Module
 * Stores technical articles and insights for the portfolio
 */

export const blogPosts = [
    {
        id: 'aws-lambda-optimization',
        title: 'Optimizing AWS Lambda Cold Starts in Spring Boot',
        summary: 'Strategies for reducing latency in serverless Java applications using SnapStart and custom runtime configuration.',
        date: '2024-11-15',
        tags: ['AWS', 'Java', 'Serverless', 'Performance'],
        readTime: '5 min read',
        content: `
# Optimizing AWS Lambda Cold Starts in Spring Boot

Serverless architecture offers incredible scalability, but Java applications on AWS Lambda often suffer from "cold starts" - the delay when a new execution environment is initialized.

## The Challenge with Java

Java's JVM startup time and class loading overhead can lead to cold starts of 3-5 seconds or more, which is unacceptable for user-facing APIs.

## Solution 1: AWS Lambda SnapStart

SnapStart is a game-changer for Java functions. It initializes your function, takes a snapshot of the memory and disk state, and caches it.

\`\`\`java
// Enable SnapStart in your template.yaml
Properties:
  SnapStart:
    ApplyOn: PublishedVersions
\`\`\`

## Solution 2: Priming

You can implement a "priming" strategy where you execute initialization logic during the snapshot creation phase rather than the invocation phase.

## Results

By implementing SnapStart and optimizing our dependency injection, we reduced P99 latency from 4.2s to 600ms for cold starts.
        `
    },
    {
        id: 'angular-state-management',
        title: 'Scalable State Management in AngularJS',
        summary: 'Best practices for managing complex state in large-scale enterprise Angular applications without over-engineering.',
        date: '2024-10-22',
        tags: ['Angular', 'Frontend', 'Architecture'],
        readTime: '7 min read',
        content: `
# Scalable State Management in AngularJS

Managing state in large Angular applications can quickly become chaotic. While libraries like NgRx are powerful, they aren't always necessary.

## The Service-with-Subject Pattern

For many applications, a simple service using RxJS BehaviorSubjects is sufficient and much cleaner.

\`\`\`typescript
@Injectable({ providedIn: 'root' })
export class UserStateService {
  private userSubject = new BehaviorSubject<User | null>(null);
  user$ = this.userSubject.asObservable();

  updateUser(user: User) {
    this.userSubject.next(user);
  }
}
\`\`\`

## When to use NgRx

If you have:
1. Complex state interactions
2. WebSocket updates affecting multiple components
3. Strict audit logging requirements

Then a full state management library becomes valuable.
        `
    },
    {
        id: 'ml-demand-forecasting',
        title: 'Demand Forecasting with LSTM Networks',
        summary: 'A deep dive into building time-series forecasting models for energy consumption using TensorFlow and Python.',
        date: '2024-09-10',
        tags: ['Machine Learning', 'Python', 'TensorFlow', 'Data Science'],
        readTime: '8 min read',
        content: `
# Demand Forecasting with LSTM Networks

Long Short-Term Memory (LSTM) networks are a type of Recurrent Neural Network (RNN) capable of learning order dependence in sequence prediction problems.

## Why LSTM for Energy Data?

Energy consumption patterns have both:
- **Short-term dependencies**: Usage an hour ago affects usage now.
- **Long-term dependencies**: Seasonal trends (summer vs winter).

Standard RNNs struggle with long-term dependencies due to the vanishing gradient problem. LSTMs solve this with their internal gate structure.

## Implementation Steps

1. **Data Preprocessing**: Normalization is critical.
2. **Sequence Creation**: Convert time series into supervised learning samples.
3. **Model Architecture**:

\`\`\`python
model = Sequential()
model.add(LSTM(50, activation='relu', input_shape=(n_steps, n_features)))
model.add(Dense(1))
model.compile(optimizer='adam', loss='mse')
\`\`\`

## Outcome

Our model achieved a 25% improvement in accuracy over the previous ARIMA-based system.
        `
    }
];
