import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database with demo user and sample interviews...");

  const demoEmail = "demo@prepai.dev";
  const passwordHash = await bcrypt.hash("Demo@12345", 10);

  // Upsert demo user
  const user = await prisma.user.upsert({
    where: { email: demoEmail },
    update: {},
    create: {
      email: demoEmail,
      name: "Demo Candidate",
      passwordHash,
      skills: ["React", "TypeScript", "Node.js", "System Design", "PostgreSQL"],
      experienceLevel: "MID",
      targetRole: "Full-Stack Software Engineer",
    },
  });

  console.log(`Demo user created/verified: ${user.email} (id: ${user.id})`);

  // Clean existing interviews for fresh seed if present
  await prisma.interview.deleteMany({
    where: { userId: user.id },
  });

  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);

  // Sample Interview 1 (Frontend focus)
  const interview1 = await prisma.interview.create({
    data: {
      userId: user.id,
      role: "Full-Stack Software Engineer",
      skills: ["React", "TypeScript", "Node.js"],
      difficulty: "MEDIUM",
      totalQuestions: 3,
      status: "COMPLETED",
      overallScore: 8.3,
      createdAt: twoDaysAgo,
      completedAt: twoDaysAgo,
      report: {
        summary:
          "Demonstrated solid conceptual depth across modern React paradigms and TypeScript typing systems. Articulation was structured, with clear appreciation for developer experience and runtime performance tradeoffs.",
        topStrengths: [
          "Strong understanding of React rendering cycles and memoization",
          "Clean explanation of structural typing in TypeScript",
          "Solid knowledge of asynchronous event loop behavior in Node.js",
        ],
        areasToImprove: [
          "Include concrete production debugging anecdotes",
          "Deepen discussion on distributed caching strategies",
        ],
        topicScores: [
          { topic: "React", score: 8.5 },
          { topic: "TypeScript", score: 8.5 },
          { topic: "Node.js", score: 8.0 },
        ],
        studyPlan: [
          {
            action: "Practice system-level state management with Server Actions",
            reason: "Strengthen full-stack cohesion between Next.js and backend state.",
          },
          {
            action: "Review V8 memory profiling techniques in Node.js",
            reason: "Elevate backend answers from mid-level to senior competence.",
          },
        ],
        readinessLevel: "INTERVIEW_READY",
      },
      questions: {
        create: [
          {
            order: 1,
            topic: "React",
            text: "Explain how React reconciles virtual DOM trees and when you would use useMemo or useCallback to optimize rendering.",
            answer: {
              create: {
                userAnswer:
                  "React uses a heuristic O(n) diffing algorithm comparing element types and keys. useMemo caches computed values across renders, and useCallback caches callback references to avoid triggering unnecessary child re-renders with memoized components.",
                score: 8.5,
                feedback: {
                  score: 8.5,
                  strengths: ["Clear explanation of O(n) diffing heuristics", "Accurate distinction between useMemo and useCallback"],
                  weaknesses: ["Could briefly mention the overhead of using memoization unnecessarily"],
                  idealAnswer:
                    "React's Fiber architecture compares elements by type and key. useMemo avoids expensive recalculations, while useCallback stabilizes function references passed to React.memo components to prevent cascading renders.",
                  tips: ["Always mention measuring with the React Profiler before premature memoization."],
                },
              },
            },
          },
          {
            order: 2,
            topic: "TypeScript",
            text: "How does structural typing differ from nominal typing, and how can you enforce nominal typing in TypeScript?",
            answer: {
              create: {
                userAnswer:
                  "TypeScript uses structural typing, meaning types are compatible if their shape and members match. Nominal typing requires an explicit declared name. In TypeScript, we can simulate nominal types using branded types with unique symbol properties.",
                score: 8.5,
                feedback: {
                  score: 8.5,
                  strengths: ["Clear distinction between shape-based compatibility and nominal declaration", "Correctly cited branded types technique"],
                  weaknesses: ["Could show a brief 1-line syntax example"],
                  idealAnswer:
                    "Structural typing checks member shape rather than explicit type names. Nominal typing can be simulated in TypeScript using branded types: `type Brand<K, T> = K & { __brand: T }`.",
                  tips: ["Mention practical use cases like preventing accidental swap of UserId and OrderId."],
                },
              },
            },
          },
          {
            order: 3,
            topic: "Node.js",
            text: "What causes the Node.js event loop to block, and what strategies do you employ to offload CPU-intensive operations?",
            answer: {
              create: {
                userAnswer:
                  "The event loop blocks when long synchronous calculations or regexes run on the single main thread. Strategies to offload include Node.js Worker Threads, child processes, or message queues with background job workers.",
                score: 8.0,
                feedback: {
                  score: 8.0,
                  strengths: ["Identified main thread blocking culprits like complex regex or synchronous math", "Mentioned worker threads and background queues"],
                  weaknesses: ["Could mention cluster module or setImmediate chunking"],
                  idealAnswer:
                    "Long synchronous tasks like cryptographic operations or heavy JSON parsing block the main V8 thread. Offload using worker_threads, Node cluster mode, setImmediate chunking, or delegating to external background microservices via Redis queues.",
                  tips: ["Always recommend monitoring event loop lag metrics in production."],
                },
              },
            },
          },
        ],
      },
    },
  });

  // Sample Interview 2 (Full-stack & Architecture focus)
  const interview2 = await prisma.interview.create({
    data: {
      userId: user.id,
      role: "Full-Stack Software Engineer",
      skills: ["System Design", "PostgreSQL", "Node.js"],
      difficulty: "HARD",
      totalQuestions: 3,
      status: "COMPLETED",
      overallScore: 9.0,
      createdAt: oneDayAgo,
      completedAt: oneDayAgo,
      report: {
        summary:
          "Exceptional technical mastery demonstrated on backend architecture and database scaling. Solutions were well-balanced with realistic trade-off analysis between latency, consistency, and operational complexity.",
        topStrengths: [
          "Nuanced understanding of PostgreSQL indexing and transaction isolation levels",
          "Comprehensive distributed caching architecture",
          "Effective explanation of idempotency and failure recovery",
        ],
        areasToImprove: [
          "Elaborate on disaster recovery and database failover mechanisms",
        ],
        topicScores: [
          { topic: "System Design", score: 9.2 },
          { topic: "PostgreSQL", score: 9.0 },
          { topic: "Node.js", score: 8.8 },
        ],
        studyPlan: [
          {
            action: "Study Raft consensus and PostgreSQL patroni replication topologies",
            reason: "Prepare for high-availability system architecture discussions at staff level.",
          },
        ],
        readinessLevel: "INTERVIEW_READY",
      },
      questions: {
        create: [
          {
            order: 1,
            topic: "System Design",
            text: "How would you design a distributed rate limiter that supports millions of concurrent API requests across multiple regional servers?",
            answer: {
              create: {
                userAnswer:
                  "I would implement a Redis-backed sliding window counter algorithm with Lua scripts for atomic increments. To minimize inter-region network latency, regional Redis instances can sync via local in-memory caches or token buckets with periodic synchronization to a central cluster.",
                score: 9.2,
                feedback: {
                  score: 9.2,
                  strengths: ["Atomic Lua scripting prevents race conditions", "Sliding window avoids burst edges", "Addressed regional latency"],
                  weaknesses: ["Mention handling Redis cluster node failures gracefully with fail-open or fail-closed policy"],
                  idealAnswer:
                    "Use a sliding-window log or counter in a Redis cluster executed via atomic Lua script. Mitigate cross-region latency using local memory token buckets that sync deltas asynchronously, backed by a configurable fail-open strategy if Redis becomes unreachable.",
                  tips: ["Always specify whether the rate limiter fails open or fails closed on infrastructure outages."],
                },
              },
            },
          },
          {
            order: 2,
            topic: "PostgreSQL",
            text: "Explain the difference between B-Tree and GIN indexes in PostgreSQL and when you should use each.",
            answer: {
              create: {
                userAnswer:
                  "B-Trees are the default balanced-tree indexes optimal for equality and range queries on scalar columns. GIN (Generalized Inverted Index) indexes each component value within composite items, making it ideal for full-text search, arrays, and JSONB document queries.",
                score: 9.0,
                feedback: {
                  score: 9.0,
                  strengths: ["Accurate distinction between scalar ranges and composite inverted keys", "Correctly cited JSONB and array use cases"],
                  weaknesses: ["Mention that GIN indexes have higher write overhead compared to B-Tree"],
                  idealAnswer:
                    "B-Tree indexes sort scalar data for fast lookups (<, <=, =, >=, BETWEEN). GIN maps individual elements or keys to rows, optimal for multi-value types like JSONB, arrays, and tsvector full-text search, traded off against slower write operations.",
                  tips: ["Mention GiST as an alternative when write throughput on composite types is critical."],
                },
              },
            },
          },
          {
            order: 3,
            topic: "Node.js",
            text: "How do you achieve idempotency in distributed payment or webhook APIs running on Node.js?",
            answer: {
              create: {
                userAnswer:
                  "Clients provide a unique Idempotency-Key header. The server uses an atomic database lock or Redis set with NX to verify if the key has been processed. If completed, return the cached previous response; if in progress, return 409 or wait.",
                score: 8.8,
                feedback: {
                  score: 8.8,
                  strengths: ["Correct use of client Idempotency-Key", "Redis SETNX or DB unique constraint for atomic locking"],
                  weaknesses: ["Mention transaction boundary handling and response payload storage"],
                  idealAnswer:
                    "Require an Idempotency-Key header. Atomically claim the key in a database table or Redis (SET NX EX). Execute payment inside an ACID transaction and store the response. Return cached response for duplicate requests, and handle failures by releasing or expiring the lock.",
                  tips: ["Emphasize setting an expiration TTL (e.g. 24-48 hours) on idempotency keys."],
                },
              },
            },
          },
        ],
      },
    },
  });

  console.log(`Seeded interview 1 (${interview1.id}) and interview 2 (${interview2.id}) successfully!`);
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
