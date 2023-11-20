// timelineai/app/api/serverless-example/route.ts
import { NextResponse, NextRequest } from 'next/server';
import OpenAI from "openai";
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY as string,
});

function processStory(events: string[]) {
  // Process the story and return a sequence of events
  // This is a placeholder - you'll need to implement this function

  return JSON.stringify(events);
}
export async function GET(request: NextRequest) {
  const story = request.nextUrl.searchParams.get('text') ?? '';
  const messages: { role: "user" | "assistant" | "function"; content: string; name?: string; }[] = [{ role: "user", content: story }];

  const functions = [
  {
    name: "process_story",
    description: `Extract each event from the story and add it to the events array. An event item could be either the event itself or a time duration between another event. This is controlled by isTimeGapEvent property. If this is true, the content of this event should be the time. Otherwise, the content is the actual event, simplified to maximum 2 words, and its "duration" would be the duration of this event. For example: "I woke up and 2 hours later I went to work" would produce 3 events, "woke up"(isTimeGapEvent is false), "2 hours later"(isTimeGapEvent s true) and "work"(false). "Duration" is optional and defines the time duration for an event. For example, "I was working for 3 hours" would produce an event with duration "3 hours".`,
    parameters: {
      type: "object",
      properties: {
        events: { 
          type: "array", 
          items: { 
            type: "object",
            properties: {
              isTimeGapEvent: { type: "boolean", description: "Indicates if the event is a time duration" },
              content: { type: "string", description: "The event or time duration, simplified to maximum 2 words" },
              duration: { type: "string", description: "The duration of an event"}
            },
            required: ["isTimeDuration", "content"]
          }, 
          description: "A list of events in the story, in chronological order" 
        },
      },
      required: [ "events"],
    },
  },
];

  

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages,
      functions: functions,
      function_call: "auto",
    });

    const responseMessage = response.choices[0].message;

    if (responseMessage.function_call) {
      const availableFunctions = {
        process_story: processStory,
      };

      const functionName = responseMessage.function_call.name;
      let functionResponse: string | undefined;

      if (functionName in availableFunctions) {
        const functionToCall = availableFunctions[functionName as keyof typeof availableFunctions];
        const functionArgs = JSON.parse(responseMessage.function_call.arguments);
        functionResponse = functionToCall(functionArgs.events);
      }

      messages.push({
        "role": "function",
        "name": functionName ?? '',
        "content": functionResponse ?? '',
      });

      let events = JSON.parse(functionResponse ?? '[]');
      
      return NextResponse.json({ events });
    }

    return NextResponse.json({ message: responseMessage.content });
  } catch (error) {
    console.error(error);
    let errorMessage = 'An error occurred';

    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return new NextResponse(JSON.stringify({ message: `Error: ${errorMessage}` }), { status: 500 });
  }
}