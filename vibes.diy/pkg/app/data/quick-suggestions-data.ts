// Static export of the quick suggestions data
// This avoids issues with YAML parsing in test environments

export interface Suggestion {
  label: string;
  text: string;
}

export const quickSuggestions: Suggestion[] = [
  {
    label: "AI Project Manager",
    text: "An intelligent project management dashboard that ingests task descriptions, schedules, and resources, then generates prioritized roadmaps, Gantt charts, and risk assessments in real time.",
  },
  {
    label: "Enterprise Image Intelligence",
    text: "A scalable image analysis system that automatically tags, categorizes, and describes uploaded media, integrates with cloud storage, and provides API endpoints for downstream ML pipelines.",
  },
  {
    label: "Conversational Knowledge Hub",
    text: "An AI-powered chat platform that connects team knowledge bases, allowing natural language Q&A across technical docs, wikis, and databases with live reference linking.",
  },
  {
    label: "Generative Music Studio",
    text: "A professional-grade sequencer that collaborates with AI to generate, mix, and master music loops, with plugin support for DAWs and real-time sound synthesis.",
  },
  {
    label: "Financial Strategy Simulator",
    text: "A personal finance and investment simulator that models student loans, compound interest, retirement goals, and Monte Carlo simulations for risk analysis.",
  },
  {
    label: "AI Culinary Lab",
    text: "A recipe generator that not only produces novel recipes but also performs nutritional analysis, suggests substitutes, and integrates with grocery APIs for one-click ordering.",
  },
  {
    label: "Smart Scheduler",
    text: "A multi-user availability manager that reconciles calendars, applies AI reasoning for best meeting times, and integrates with Google Calendar and Outlook.",
  },
  {
    label: "Climate Visualization",
    text: "A real-time weather and climate visualization tool that converts live API data into immersive, dynamic gradients, charts, and interactive 3D environments.",
  },
  {
    label: "Next-Gen Learning Platform",
    text: "An adaptive flashcard and quiz engine that uses retrieval practice, spaced repetition, and generative AI to personalize study plans for professional certifications.",
  },
  {
    label: "Healthcare Assistant",
    text: "A HIPAA-compliant virtual assistant that manages patient intake, summarizes medical histories, and triages queries before routing them to clinicians.",
  },
  {
    label: "AI-Powered Legal Research",
    text: "A document intelligence system that parses contracts and case law, extracts key precedents, flags risks, and generates structured briefs for lawyers.",
  },
  {
    label: "3D Cultural Heritage Explorer",
    text: "A web app that reconstructs iconic artworks and historical sites in 3D using Three.js and AI image-to-geometry models, allowing interactive exploration.",
  },
  {
    label: "Cybersecurity Copilot",
    text: "Anomaly detection and response assistant that monitors logs in real time, flags suspicious activity, and suggests automated remediation scripts.",
  },
  {
    label: "AI-Powered Portfolio Tracker",
    text: "A personal finance dashboard that connects to exchanges and brokerages, runs AI-driven market analysis, and generates rebalancing strategies.",
  },
  {
    label: "Wildcard Innovation",
    text: "An experimental AI incubator project that surprises users with unexpected prototypes — from generative art tools to autonomous research agents.",
  },
];

export default quickSuggestions;
