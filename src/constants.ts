import { Note } from './types';

export const INITIAL_NOTES: Note[] = [
  {
    id: '1',
    title: 'The Digital Moleskine Framework',
    category: 'Tech Design',
    date: 'Aug 24',
    pros: ['High tactile focus', 'intentional white space', 'editorial flow'],
    cons: ['Steep learning curve for standard Material users'],
    solution: 'Focus on physical metaphors and high-contrast typography.',
    tags: ['design', 'framework'],
    isFavorite: true,
    authorAvatar: 'https://picsum.photos/seed/avatar1/100/100',
  },
  {
    id: '2',
    title: 'Kyoto Morning Rituals',
    category: 'Travel Log',
    date: 'Aug 23',
    pros: ['Incredible light for photography', 'quiet streets at dawn'],
    cons: ['Limited breakfast options open before 7 AM'],
    solution: 'Plan early morning shoots and carry portable snacks.',
    tags: ['travel', 'photography'],
    isPinned: true,
    authorInitials: 'KY',
  },
  {
    id: '3',
    title: 'New Color Palette Analysis',
    category: 'Project Alpha',
    date: 'Aug 24',
    pros: ['Primary #0058bd offers superior accessibility ratios'],
    cons: ['Requires careful balancing with warm neutrals'],
    solution: 'Use a 60-30-10 rule with neutral backgrounds and vibrant accents.',
    tags: ['color', 'accessibility'],
    authorAvatar: 'https://picsum.photos/seed/avatar2/100/100',
  },
  {
    id: '4',
    title: 'Thinking, Fast and Slow',
    category: 'Bookshelf',
    date: 'Aug 12',
    pros: ['Essential mental models for product decision making'],
    cons: ['Densely packed', 'needs multiple reads to absorb'],
    solution: 'Summarize key chapters into actionable heuristics.',
    tags: ['psychology', 'decision-making'],
  },
  {
    id: '5',
    title: 'Evaluating Micro-Frontend Architectures for 2024 Project',
    category: 'Research',
    date: 'Oct 24, 2023',
    modifiedDate: 'Oct 24, 2023',
    pros: [
      'Independent deployment cycles for various feature teams reduces bottlenecking.',
      'Technology agnostic; allows teams to use React, Vue, or Angular where appropriate.',
      'Improved fault tolerance—a failure in one module doesn\'t crash the entire shell.'
    ],
    cons: [
      'Significant increase in initial infrastructure setup and CI/CD complexity.',
      'Risk of inconsistent UX/UI across different modules if design tokens aren\'t strictly shared.',
      'Payload size overhead from loading multiple framework runtimes.'
    ],
    solution: 'After careful analysis, we will proceed with a **Module Federation** approach using Webpack 5. This allows us to share common dependencies (like our Design System) to mitigate the payload size "Con", while maintaining the independent deployment "Pro".\n\n"The focus should be on creating a \'Shared Shell\' that handles authentication and routing, while business domains are lazy-loaded as remote modules."',
    tags: ['architecture', 'q4-planning', 'tech-stack'],
    referenceUrl: 'https://architecture.internal.docs/micro-frontends',
  }
];
