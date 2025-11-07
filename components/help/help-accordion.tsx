'use client'

import { useState } from 'react'

interface HelpItem {
  question: string
  answer: string
}

interface HelpSection {
  id: string
  title: string
  icon: React.ReactNode
  items: HelpItem[]
}

interface HelpAccordionProps {
  sections: HelpSection[]
}

export function HelpAccordion({ sections }: HelpAccordionProps) {
  // Open first section by default
  const [openSections, setOpenSections] = useState<Set<string>>(
    new Set(sections.length > 0 ? [sections[0].id] : [])
  )
  const [openItems, setOpenItems] = useState<Set<string>>(new Set())

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId)
      } else {
        newSet.add(sectionId)
      }
      return newSet
    })
  }

  const toggleItem = (itemId: string) => {
    setOpenItems((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }

  return (
    <div className="space-y-8">
      {sections.map((section, sectionIndex) => {
        const isSectionOpen = openSections.has(section.id)
        return (
          <div
            key={section.id}
            id={section.id}
            className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-fade-in"
            style={{ animationDelay: `${sectionIndex * 0.1}s` }}
          >
            {/* Section Header */}
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between p-6 sm:p-8 hover:bg-gray-50 transition-colors text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <div className="text-purple-600">{section.icon}</div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
              </div>
              <svg
                className={`h-6 w-6 text-gray-500 transition-transform duration-200 ${
                  isSectionOpen ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Section Content */}
            {isSectionOpen && (
              <div className="px-6 sm:px-8 pb-6 sm:pb-8 animate-slide-down">
                <div className="space-y-4">
                  {section.items.map((item, itemIndex) => {
                    const itemId = `${section.id}-${itemIndex}`
                    const isItemOpen = openItems.has(itemId)
                    return (
                      <div
                        key={itemIndex}
                        className="border border-gray-200 rounded-lg overflow-hidden hover:border-purple-300 transition-colors"
                      >
                        <button
                          onClick={() => toggleItem(itemId)}
                          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors text-left"
                        >
                          <h3 className="text-lg font-semibold text-gray-900 pr-4">{item.question}</h3>
                          <svg
                            className={`h-5 w-5 text-purple-600 flex-shrink-0 transition-transform duration-200 ${
                              isItemOpen ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {isItemOpen && (
                          <div className="px-4 pb-4 animate-slide-down">
                            <p className="text-gray-600 leading-relaxed">{item.answer}</p>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

