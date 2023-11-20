
'use client'

import React, { useState  } from 'react';
import 'tailwindcss/tailwind.css';

interface Event {
  isTimeGapEvent: boolean;
  content: string;
  duration: string;
}

export default function Home() {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<Event[]>([]);


  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(event.target.value);
    };
  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    setEvents([]); // Clear the previous events
  
    try {
      const response = await fetch(`/api/serverless-example?text=${encodeURIComponent(inputText)}`);
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      const data = await response.json();
      setEvents(data.events); // Store the new events in state
  
    } catch (error) {
      
      console.error(error);
      let errorMessage = 'An error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      console.log(events)
    }
  };



  return (
    <div className="container mx-auto px-4">
      <h1 className="text-4xl font-bold mt-8">Timeline Generator</h1>
      <div className="input-area mt-8">
        <textarea 
          id="user-input" 
          className="w-full h-32 p-2 text-black mb-4" 
          placeholder="Type your text here..."
          value={inputText}
          onChange={handleInputChange}
          disabled={isLoading}
        ></textarea>
       <button 
  id="submit-btn" 
  className={`px-4 py-2 text-white rounded ${isLoading || inputText.trim() === '' ? 'bg-gray-500' : 'bg-blue-500'}`}
  onClick={handleSubmit}
  disabled={isLoading || inputText.trim() === ''}
>
  {isLoading ? 'Loading...' : 'Generate Timeline'}
</button>
        {events.length > 0 && <p className="mt-16 text-sm">Generated timeline:</p>}
        <div className="flex flex-wrap items-center overflow-x-auto mt-4">
        {events.map((event, index) => (
  <React.Fragment key={index}>
    <div className={`mr-5 my-2 p-2 ${event.isTimeGapEvent ? '' : 'border-2 border-gray-300'}`}>
      {event.content}
      {event.duration && <p className="mt-2 text-sm text-gray-500">{event.duration}</p>}
    </div>
    {index < events.length - 1 && (
      <svg className="mr-5 my-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
      </svg>
    )}
  </React.Fragment>
))}
        </div>
      </div>
    </div>
  );

}