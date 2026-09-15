import dotenv from 'dotenv';
import mongoose from 'mongoose';
import dns from 'node:dns';
import Category from './models/Category.js';
import Course from './models/Course.js';
import User from './models/User.js';

dotenv.config();

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {}

const seedCoursesAndCategories = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    console.log('[Seed] Connecting to MongoDB...');
    await mongoose.connect(uri, { family: 4, serverSelectionTimeoutMS: 8000 });
    console.log('[Seed] Connected successfully.');

    // 1. Ensure instructor account exists
    let instructor = await User.findOne({ email: 'instructor@example.com' });
    if (!instructor) {
      console.log('[Seed] Creating instructor account...');
      instructor = await User.create({
        name: 'Dr. Marcus Vance',
        email: 'instructor@example.com',
        password: 'instructor123',
        role: 'instructor',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
        bio: 'Distinguished Software Architect and Senior Computer Science Fellow with 14+ years designing scalable cloud-native architectures.',
      });
    }

    // 2. Seed Categories
    console.log('[Seed] Seeding categories...');
    const categoryData = [
      {
        name: 'Web & Software Engineering',
        description: 'Modern full-stack architectures, frontend micro-frameworks, and robust distributed backend engineering.',
        image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80',
      },
      {
        name: 'Data Science & Machine Learning',
        description: 'Empirical data analysis, neural networks, predictive algorithms, and enterprise ML pipelines.',
        image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=80',
      },
      {
        name: 'Cloud Computing & DevOps',
        description: 'Container orchestration, continuous integration pipelines, Terraform infrastructure, and AWS cloud solutions.',
        image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
      },
      {
        name: 'Cyber Security & Defense',
        description: 'Ethical penetration testing, vulnerability assessment, cryptography, and zero-trust perimeter defense.',
        image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&auto=format&fit=crop&q=80',
      },
      {
        name: 'UI/UX & Digital Product Design',
        description: 'Design thinking, human-computer interaction, accessibility standards, and scalable Figma design systems.',
        image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=600&auto=format&fit=crop&q=80',
      },
    ];

    const categoryMap = {};
    for (const cat of categoryData) {
      let existingCat = await Category.findOne({ name: cat.name });
      if (!existingCat) {
        existingCat = await Category.create(cat);
      }
      categoryMap[cat.name] = existingCat._id;
    }
    console.log(`[Seed] Seeded ${Object.keys(categoryMap).length} categories.`);

    // 3. Seed Courses
    console.log('[Seed] Seeding realistic course curriculum...');
    const coursesData = [
      {
        title: 'Full-Stack React & Node.js Architecture',
        subtitle: 'Build production-ready distributed web apps with React 19, Express, Redux Toolkit, and MongoDB.',
        description: 'An industry-grade immersion into modern full-stack web engineering. You will master scalable architecture, RESTful API design, state synchronization, secure JWT cookie sessions, Dockerized deployments, and production performance tuning.',
        thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=80',
        instructor: instructor._id,
        category: categoryMap['Web & Software Engineering'],
        price: 89.99,
        level: 'intermediate',
        language: 'English',
        requirements: [
          'Solid fundamentals of modern JavaScript (ES6+)',
          'Familiarity with HTML5, CSS, and basic HTTP methods',
          'A computer capable of running Node.js 20+ and VS Code',
        ],
        learningObjectives: [
          'Architect clean, maintainable micro-frontends and full-stack React systems',
          'Build secure REST APIs with Node.js, Express, and Mongoose validation',
          'Implement enterprise JWT authentication and role-based access control',
          'Deploy optimized containerized full-stack apps to cloud infrastructure',
        ],
        rating: 4.9,
        totalReviews: 428,
        enrolledStudents: 3410,
        status: 'published',
      },
      {
        title: 'Python for Data Science & Machine Learning',
        subtitle: 'From exploratory data analysis and NumPy to Deep Learning with PyTorch and Scikit-Learn.',
        description: 'Master the end-to-end data science lifecycle. Learn exploratory data analysis, data wrangling with Pandas, vector mathematics with NumPy, predictive modeling with Scikit-Learn, and building neural networks in PyTorch.',
        thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
        instructor: instructor._id,
        category: categoryMap['Data Science & Machine Learning'],
        price: 79.99,
        level: 'beginner',
        language: 'English',
        requirements: [
          'Basic high school algebra and mathematical intuition',
          'No prior programming knowledge required—starts from foundational syntax',
        ],
        learningObjectives: [
          'Clean, preprocess, and visualize complex real-world datasets',
          'Train, evaluate, and tune machine learning classifiers and regressors',
          'Build end-to-end predictive pipelines with cross-validation',
          'Deploy trained models as interactive prediction endpoints',
        ],
        rating: 4.8,
        totalReviews: 612,
        enrolledStudents: 5290,
        status: 'published',
      },
      {
        title: 'AWS Solutions Architect Professional Handbook',
        subtitle: 'Design resilient, cost-optimized, and highly available architectures across multi-region AWS cloud.',
        description: 'Prepare for real-world enterprise infrastructure challenges and the AWS Solutions Architect exam. Covers VPC peering, Transit Gateways, Auto-scaling ECS clusters, DynamoDB global tables, S3 lifecycle management, and IAM zero-trust.',
        thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
        instructor: instructor._id,
        category: categoryMap['Cloud Computing & DevOps'],
        price: 99.99,
        level: 'advanced',
        language: 'English',
        requirements: [
          'Prior hands-on experience working with Linux command line',
          'Basic networking knowledge (CIDR blocks, DNS, subnets, gateways)',
          'An active AWS free tier account',
        ],
        learningObjectives: [
          'Architect fault-tolerant, disaster-resilient systems across AWS availability zones',
          'Configure secure VPC networking with private subnets and NAT gateways',
          'Automate multi-environment infrastructure provisioning with CloudFormation and Terraform',
          'Implement fine-grained IAM policies and encryption key rotations',
        ],
        rating: 4.9,
        totalReviews: 295,
        enrolledStudents: 2180,
        status: 'published',
      },
      {
        title: 'Modern UI/UX Design Systems in Figma',
        subtitle: 'Design scalable components, auto-layouts, accessibility tokens, and interactive micro-prototypes.',
        description: 'Learn how world-class product designers construct enterprise design systems. Master Figma variables, nested auto-layouts, accessible color contrast ratios, atomic design hierarchy, and handoff workflows for frontend engineers.',
        thumbnail: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?w=800&auto=format&fit=crop&q=80',
        instructor: instructor._id,
        category: categoryMap['UI/UX & Digital Product Design'],
        price: 0,
        level: 'beginner',
        language: 'English',
        requirements: [
          'Figma free desktop application installed',
          'A desire to understand digital human interaction design',
        ],
        learningObjectives: [
          'Construct responsive components using advanced Figma Auto Layout 5.0',
          'Build accessible typography hierarchies and semantic color token sets',
          'Create high-fidelity interactive user flows with smart animation triggers',
          'Conduct usability audits and package production-ready assets for developers',
        ],
        rating: 4.7,
        totalReviews: 530,
        enrolledStudents: 8120,
        status: 'published',
      },
      {
        title: 'Ethical Hacking & Web Penetration Testing',
        subtitle: 'Identify, exploit, and remediate OWASP Top 10 vulnerabilities in modern web applications.',
        description: 'Comprehensive offensive security training designed for defensive developers and aspiring security analysts. Covers SQL injection, Cross-Site Scripting (XSS), Server-Side Request Forgery (SSRF), JWT bypasses, and Burp Suite automation.',
        thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
        instructor: instructor._id,
        category: categoryMap['Cyber Security & Defense'],
        price: 84.99,
        level: 'intermediate',
        language: 'English',
        requirements: [
          'Understanding of web protocols: HTTP, TCP/IP, cookies, and CORS',
          'Basic familiarity with Linux terminal commands',
        ],
        learningObjectives: [
          'Set up safe, isolated penetration testing labs using Kali Linux and Docker',
          'Audit web applications for OWASP Top 10 security vulnerabilities',
          'Intercept and manipulate raw HTTP traffic using Burp Suite Professional',
          'Author professional penetration testing and security assessment reports',
        ],
        rating: 4.9,
        totalReviews: 384,
        enrolledStudents: 3100,
        status: 'published',
      },
      {
        title: 'Kubernetes & Microservices Infrastructure',
        subtitle: 'Deploy, scale, and monitor distributed microservices with Kubernetes, Helm, and Prometheus.',
        description: 'Deep-dive into production container orchestration. You will write declarative Pod, Deployment, and Service manifests, manage Helm charts, configure ingress controllers, handle persistent volumes, and monitor clusters with Grafana.',
        thumbnail: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=800&auto=format&fit=crop&q=80',
        instructor: instructor._id,
        category: categoryMap['Cloud Computing & DevOps'],
        price: 94.99,
        level: 'advanced',
        language: 'English',
        requirements: [
          'Working knowledge of Docker containers and Dockerfiles',
          'Familiarity with basic YAML syntax and command-line interfaces',
        ],
        learningObjectives: [
          'Manage multi-node Kubernetes clusters on bare-metal and cloud providers',
          'Implement rolling deployments, zero-downtime rollbacks, and health probes',
          'Secure clusters using Network Policies, ServiceAccounts, and RBAC roles',
          'Deploy real-time telemetry dashboards using Prometheus and Grafana',
        ],
        rating: 4.8,
        totalReviews: 210,
        enrolledStudents: 1640,
        status: 'published',
      },
      {
        title: 'Computer Science & Algorithms in TypeScript',
        subtitle: 'Essential data structures, Big-O notation, tree traversals, and dynamic programming algorithms.',
        description: 'Strengthen your core software engineering foundation. Study linked lists, hash tables, binary search trees, graph algorithms (BFS/DFS, Dijkstra), sorting algorithms, and dynamic programming through strongly typed TypeScript code.',
        thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=80',
        instructor: instructor._id,
        category: categoryMap['Web & Software Engineering'],
        price: 0,
        level: 'beginner',
        language: 'English',
        requirements: [
          'Basic programming fundamentals in any language (loops, functions, variables)',
        ],
        learningObjectives: [
          'Analyze algorithmic time and space complexity using Big-O notation',
          'Implement fundamental data structures from scratch with TypeScript generics',
          'Solve complex graph and tree traversal algorithmic problems',
          'Excel in technical software engineering coding interviews',
        ],
        rating: 4.9,
        totalReviews: 780,
        enrolledStudents: 9450,
        status: 'published',
      },
      {
        title: 'Next-Gen Generative AI with LangChain & Vector DBs',
        subtitle: 'Build autonomous AI agents, retrieval-augmented generation (RAG), and custom LLM workflows.',
        description: 'Harness the cutting edge of Generative AI. Construct production RAG pipelines with Pinecone, ChromaDB, and LangChain. Implement semantic search, agent tool calling, structured JSON output validation, and local LLM fine-tuning.',
        thumbnail: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&auto=format&fit=crop&q=80',
        instructor: instructor._id,
        category: categoryMap['Data Science & Machine Learning'],
        price: 99.99,
        level: 'intermediate',
        language: 'English',
        requirements: [
          'Intermediate Python programming proficiency',
          'Basic understanding of REST APIs and JSON',
        ],
        learningObjectives: [
          'Build multi-document Retrieval Augmented Generation (RAG) architectures',
          'Embed and query high-dimensional vector representations with Pinecone',
          'Create self-directing AI agent loops equipped with external calculation tools',
          'Optimize LLM inference latency, token usage, and prompt guardrails',
        ],
        rating: 4.9,
        totalReviews: 340,
        enrolledStudents: 2890,
        status: 'published',
      },
      {
        title: 'Advanced Rust Systems Programming',
        subtitle: 'Memory safety without garbage collection, concurrency primitives, and async tokio runtimes.',
        description: 'Explore deep systems programming with Rust. Master lifetimes, ownership semantics, zero-cost abstractions, unsafe blocks, and cross-platform native binary compilation.',
        thumbnail: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&auto=format&fit=crop&q=80',
        instructor: instructor._id,
        category: categoryMap['Web & Software Engineering'],
        price: 69.99,
        level: 'advanced',
        language: 'English',
        requirements: [
          'Solid understanding of C, C++, or Go memory concepts',
        ],
        learningObjectives: [
          'Master Rust ownership, borrow checker, and lifetime annotations',
          'Build lock-free multi-threaded applications with atomic primitives',
        ],
        rating: 4.7,
        totalReviews: 45,
        enrolledStudents: 310,
        status: 'draft', // Draft course for testing
      },
    ];

    for (const c of coursesData) {
      const existing = await Course.findOne({ title: c.title });
      if (!existing) {
        await Course.create(c);
      } else {
        await Course.findByIdAndUpdate(existing._id, c);
      }
    }

    const totalCount = await Course.countDocuments();
    console.log(`[Seed] Course seeding complete. Total courses in database: ${totalCount}`);
    process.exit(0);
  } catch (error) {
    console.error('[Seed] Error during seeding:', error.message);
    process.exit(1);
  }
};

seedCoursesAndCategories();
