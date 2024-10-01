'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Power, User, Settings } from "lucide-react"

export function ExtensionMockup() {
  const [isBlocking, setIsBlocking] = useState(true)
  const [patterns, setPatterns] = useState(['*://*.facebook.com/*', '*://*.twitter.com/*'])
  const [newPattern, setNewPattern] = useState('')
  const [pulse, setPulse] = useState(false)
  const [shimmer, setShimmer] = useState(false)

  const toggleBlocking = () => setIsBlocking(!isBlocking)

  const addPattern = () => {
    if (newPattern) {
      setPatterns([...patterns, newPattern])
      setNewPattern('')
    }
  }

  useEffect(() => {
    const pulseInterval = setInterval(() => {
      setPulse(prev => !prev)
    }, 2000)

    const shimmerInterval = setInterval(() => {
      setShimmer(prev => !prev)
    }, 3000)

    return () => {
      clearInterval(pulseInterval)
      clearInterval(shimmerInterval)
    }
  }, [])

  return (
    <div className="w-80 p-6 bg-gradient-to-br from-blue-50 to-indigo-100 font-sans rounded-lg shadow-lg relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 transform -skew-x-12 transition-transform duration-3000 ease-in-out" 
           style={{ animation: 'shimmer 6s infinite linear', transform: `translateX(${shimmer ? '100%' : '-100%'})` }}></div>
      <div className="relative z-10">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-indigo-800">Un-Tab</h1>
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon" className="transition-transform duration-200">
              <User className="h-5 w-5 text-indigo-600" />
            </Button>
            <Button variant="ghost" size="icon" className="transition-transform duration-200">
              <Settings className="h-5 w-5 text-indigo-600" />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleBlocking} className="transition-transform duration-200">
              <Power className={`h-6 w-6 ${isBlocking ? 'text-green-500' : 'text-red-500'}`} />
            </Button>
          </div>
        </div>

        <div className="border-t border-indigo-200 my-4" />
        
        <div className={`mb-4 p-2 rounded-lg text-center font-semibold transition-all duration-300 ${isBlocking ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'} ${pulse ? 'scale-105 opacity-80' : 'scale-100 opacity-100'}`}>
          {isBlocking ? 'Blocking Active' : 'Blocking Inactive'}
        </div>
        
        <p className="text-sm text-indigo-600 mb-4 text-xs text-center">
          {isBlocking ? '🚫 Blocked sites will be prevented from opening' : '🟢 All sites allowed through'}
        </p>

        <div className="border-t border-indigo-200 my-4" />
        
        <div className="mb-4 p-3 bg-white rounded-lg shadow-sm transition-all duration-300">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-indigo-700">Current Domain</h2>
            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">✅ Not Blocked</span>
          </div>
          <p className="text-indigo-800 text-center p-2 bg-indigo-50 rounded-lg">v0.dev</p>
          <Button className="mt-2 w-full bg-indigo-600 hover:bg-indigo-700 transition-all duration-300">Block This Domain</Button>
        </div>

        <div className="border-t border-indigo-200 my-4" />
        
        <h2 className="text-lg font-semibold text-indigo-700 mb-2 flex items-center justify-between">
          Blocked Patterns
          <span className="text-sm font-medium text-indigo-600">{patterns.length}/5</span>
        </h2>
        
        <ul className="mt-4 space-y-3 max-h-60 overflow-y-auto">
          {patterns.map((pattern, index) => (
            <li key={index} className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm transition-all duration-300" style={{ animation: `fadeIn 0.5s ${index * 0.1}s both` }}>
              <span className="text-indigo-800">{pattern}</span>
              <Button variant="ghost" className="text-red-500 hover:text-red-700 transition-all duration-300">Remove</Button>
            </li>
          ))}
        </ul>

        <div className="my-6 border-t border-indigo-200" />
        
        <h2 className="text-lg font-semibold text-indigo-700 mb-2">Add New Pattern</h2>
        <div className="mb-4">
          <Input
            type="text"
            placeholder="Enter URL pattern"
            value={newPattern}
            onChange={(e) => setNewPattern(e.target.value)}
            className="w-full p-3 border border-indigo-200 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none transition-all duration-300"
          />
        </div>
        <Button className="w-full bg-indigo-600 hover:bg-indigo-700 transition-all duration-300" onClick={addPattern}>
          Add Pattern
        </Button>
      </div>
    </div>
  )
}