# AI SmartFlow

Build a modern, professional, responsive web application called AI Workplace Productivity Assistant.

The application must be ONE integrated workplace productivity platform with a shared dashboard and sidebar navigation. Do not build separate unrelated applications.

PRIMARY GOAL

Help professionals automate common workplace tasks using AI while keeping users in control of all AI-generated content.

APPLICATION STRUCTURE

Create a responsive dashboard with:

Left sidebar navigation on desktop

Collapsible/mobile navigation on smaller screens

Top navigation/header

Main content area

Professional corporate visual style

Clean cards, forms, buttons, alerts and empty states

Responsive layouts for desktop, tablet and mobile

Accessible color contrast and readable typography

SIDEBAR NAVIGATION

Include:

Dashboard

Smart Email Generator

Meeting Notes Summarizer

AI Task Planner

AI Research Assistant

AI Workplace Chatbot

Settings

DASHBOARD

Create a useful overview page containing:

Welcome message

Quick-action cards for each AI feature

Recent activity

Productivity statistics or useful summary cards

Shortcuts to frequently used tools

Responsible AI notice

FEATURE 1: SMART EMAIL GENERATOR

Create an email-generation interface containing:

Input fields:

Recipient/context

Purpose of email

Key points

Tone selector: Formal, Friendly, Persuasive

Desired length

AI output should contain:

Subject

Email body

Allow users to:

Edit generated content

Regenerate

Copy

Clear

Start over

Use structured AI prompting. The AI must not invent facts that were not provided by the user.

FEATURE 2: MEETING NOTES SUMMARIZER

Create an interface where users can paste meeting notes.

Generate structured output containing:

Executive summary

Key discussion points

Decisions made

Action items

Deadlines

People responsible for actions when identifiable

Keep the output editable and easy to copy.

FEATURE 3: AI TASK PLANNER

Allow users to enter multiple workplace tasks.

Collect:

Task description

Priority

Deadline

Estimated duration

Available working hours

AI should:

Prioritize tasks

Identify urgent tasks

Organize tasks logically

Generate a daily or weekly schedule

Explain prioritization briefly

Display the resulting plan in a clean timeline or task-card interface.

FEATURE 4: AI RESEARCH ASSISTANT

Create a research interface where users enter a topic or question.

Generate:

Topic summary

Key insights

Important considerations

Recommendations

Follow-up questions

Do not fabricate sources. Clearly distinguish between AI-generated information and verified external sources.

Include a visible reminder that important research findings should be independently verified.

FEATURE 5: AI WORKPLACE CHATBOT

Create a modern conversational AI interface.

Features:

Chat history within the current session

User messages

AI responses

Loading state

Clear conversation button

Suggested workplace prompts

Suggested prompts could include:

"Help me prepare for a meeting."

"Turn these notes into an action plan."

"Help me write a professional email."

"Help me prioritize my tasks."

PROMPT ENGINEERING

Use structured prompts for every AI feature.

Prompts should clearly define:

AI role

User context

User input

Task

Constraints

Desired tone

Required output format

Accuracy limitations

Responsible AI instructions

Use predictable structured outputs wherever appropriate.

RESPONSIBLE AI

Include a clearly visible Responsible AI notice:

"AI-generated content may contain errors or omissions. Review and verify important information before sending emails, making decisions, or acting on recommendations. Do not enter confidential or sensitive information unless permitted by your organization's policies."

AI should:

Avoid inventing facts

Avoid pretending uncertain information is certain

Encourage verification for important information

Keep users responsible for final decisions

Allow users to edit AI-generated content

UI/UX REQUIREMENTS

Use a polished modern SaaS/dashboard aesthetic.

Use:

Professional blue/indigo primary color

Neutral background

Clear hierarchy

Consistent spacing

Rounded cards

Subtle shadows

Meaningful icons

Clear call-to-action buttons

Helpful empty states

Loading states

Error states

Success feedback

Avoid excessive animations, clutter and unnecessary decorative elements.

DEMONSTRATION QUALITY

The application should feel like a realistic workplace product rather than a simple AI demo.

Each feature must have:

Clear user input

AI processing/loading state

Structured AI output

Editable output where appropriate

Copy/regenerate/reset actions

Appropriate responsible-AI guidance

Ensure navigation between all features works correctly and the entire application feels like one cohesive platform.    mae it more secured ,json web token as well must be there, security must be tight, i want it to be dynamic and animated.also AI generated pictures, i want it to be more attractive and catchy

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d5d46b69-934b-4844-a479-4ece3d4b7ddb).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
