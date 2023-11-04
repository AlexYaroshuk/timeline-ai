// timelineai/app/api/serverless-example/route.ts
import { NextResponse, NextRequest } from 'next/server';
import OpenAI from "openai";
const openai = new OpenAI(process.env.OPENAI_API_KEY);

function processStory(events) {
  // Process the story and return a sequence of events
  // This is a placeholder - you'll need to implement this function
  const processedEvents = events; // Use the events parameter directly
  return JSON.stringify(events);
}

export async function GET(request: NextRequest) {
  const story = request.nextUrl.searchParams.get('text');
  const messages = [{ role: "user", content: story }];

  const functions = [
    {
      name: "process_story",
      description: `Extract each event from the story and add it to the events array. Each event should not be more than 2-3 words, simplify whenever possible. This is the processed story: ${story}`,
      parameters: {
        type: "object",
        properties: {
      
          events: { type: "array", items: { type: "string" }, description: "A list of events in the story, in chronological order" },
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
      const functionToCall = availableFunctions[functionName];
      const functionArgs = JSON.parse(responseMessage.function_call.arguments);
      const functionResponse = functionToCall(functionArgs.events);
   

      messages.push(responseMessage);
      messages.push({
        "role": "function",
        "name": functionName,
        "content": functionResponse,
      });

      const secondResponse = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: messages,
      });
    
      return NextResponse.json({

        events: JSON.parse(functionResponse),
      });
    }

    return NextResponse.json({ message: responseMessage.content });
  } catch (error) {
    console.error(error);
    return NextResponse.error(`Error: ${error.message}`, 500);
  }
}