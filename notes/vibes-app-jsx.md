# Vibes DIY App JSX Guide

## Overview

Vibes DIY apps are React components that combine Fireproof database, CallAI for LLM interactions, and use-vibes for UI components. They follow a neobrutalist design aesthetic with bright colors and bold borders.

## Core Imports

```javascript
import React from "react"
import { callAI, useFireproof, toCloud, ImgGen } from "use-vibes"
```

## Fireproof Setup

### Basic Setup
```javascript
const { useDocument, useLiveQuery, database } = useFireproof("database-name")
```

### With Cloud Sync (No Tenant/Ledger)
```javascript
const { useDocument, useLiveQuery, database, attach } = useFireproof("database-name", { 
  attach: toCloud() 
})
```

### With Cloud Sync (Specific Tenant/Ledger)
```javascript
const { useDocument, useLiveQuery, database, attach } = useFireproof("database-name", { 
  attach: toCloud({
    tenant: "tenant-id",
    ledger: "ledger-id"
  })
})
```

## Document Management

### Creating/Editing Documents
```javascript
const { doc, merge, submit } = useDocument({ text: "" })

// In JSX:
<form onSubmit={submit}>
  <input
    value={doc.text}
    onChange={(e) => merge({ text: e.target.value })}
    placeholder="Enter text..."
  />
  <button type="submit">Save</button>
</form>
```

### Querying Documents
```javascript
// Basic query by field
const { docs } = useLiveQuery("fieldName", { key: "value" })

// Custom query function
const { docs } = useLiveQuery((doc) => doc.text && doc._id, { 
  descending: true, 
  limit: 10 
})

// Query by type
const { docs } = useLiveQuery("type", { key: "note" })
```

## CallAI Integration

### Basic Usage
```javascript
const response = await callAI("Your prompt here")
```

### Streaming
```javascript
const generator = await callAI("Your prompt", { stream: true })

let result = ""
for await (const chunk of generator) {
  result = chunk
}
```

### With Schema
```javascript
const response = await callAI("Generate data", {
  schema: {
    properties: {
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            value: { type: "number" }
          }
        }
      }
    }
  }
})
```

### Common Button Styles
```javascript
className="px-3 py-2 bg-[#ff70a6] text-[#242424] font-bold border-2 border-[#242424] rounded text-sm"
```

### Input Styles
```javascript
className="flex-1 p-2 text-[#242424] bg-white border-2 border-[#242424] rounded text-sm"
```

### Card/Container Styles
```javascript
className="p-2 bg-white border border-[#242424] rounded"
```

## Common Patterns

### Note Taking App
```javascript
export default function NotesApp() {
  const { useDocument, useLiveQuery, database } = useFireproof("notes")
  const { doc, merge, submit } = useDocument({ text: "" })
  const { docs } = useLiveQuery("text", { descending: true, limit: 10 })

  return (
    <div className="min-h-screen bg-[#ffd670] p-2">
      <div className="max-w-xl mx-auto">
        <form onSubmit={submit} className="flex gap-1 mb-3">
          <input
            value={doc.text}
            onChange={(e) => merge({ text: e.target.value })}
            placeholder="Write a note..."
            className="flex-1 p-2 text-[#242424] bg-white border-2 border-[#242424] rounded text-sm"
          />
          <button
            type="submit"
            className="px-3 py-2 bg-[#ff70a6] text-[#242424] font-bold border-2 border-[#242424] rounded text-sm"
          >
            Save
          </button>
        </form>

        <div className="space-y-2">
          {docs.map(note => (
            <div key={note._id} className="p-2 bg-white border border-[#242424] rounded">
              <p className="text-[#242424] text-sm">{note.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

### AI Integration Pattern
```javascript
const expandWithAI = async (item) => {
  const generator = await callAI(`Transform this: "${item.text}"`, {
    stream: true
  })

  let result = ""
  for await (const chunk of generator) {
    result = chunk
  }

  await database.put({
    ...item,
    aiResult: result,
    processedAt: Date.now()
  })
}
```

### Debug Information
```javascript
// Debug attach state
React.useEffect(() => {
  if (attach) {
    console.log("Attach object:", attach)
    console.log("Attach state:", attach.state)
  }
}, [attach])

// Debug area in UI
<div className="mt-3 p-2 bg-black/10 border border-[#242424] rounded text-xs font-mono">
  <div className="text-[#242424]">
    <div><strong>State:</strong> {attach?.state || 'N/A'}</div>
  </div>
</div>
```

## Image Generation

### Basic ImgGen Usage
```javascript
<ImgGen
  prompt="Your image prompt"
  options={{
    quality: 'medium',
    size: '1024x1024'
  }}
  onComplete={() => console.log('Image generated')}
  onError={(error) => console.error('Error:', error)}
/>
```

## Utility Functions

### Database Operations
```javascript
const logAllDocs = async () => {
  const result = await database.allDocs()
  console.log(result)
}

const addRandomData = () => {
  database.put({ rand: Math.random(), createdAt: Date.now() })
}
```

## Export Pattern

Always use default export:
```javascript
export default function MyVibesApp() {
  // Component code
}
```

## Key Principles

1. **Local-first**: Fireproof works offline, no loading states needed
2. **Real-time**: Use `useLiveQuery` for live data updates
3. **Bright colors**: Follow the neobrutalist color palette
4. **Bold borders**: Always use `border-2 border-[#242424]` for emphasis
5. **Small text**: Use `text-sm` and `text-xs` for compact interfaces
6. **Debug-friendly**: Include debug areas and console logging
7. **AI-enhanced**: Use `callAI` to add intelligence to user interactions