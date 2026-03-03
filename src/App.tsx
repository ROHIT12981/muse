/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Editor } from './components/Editor';
import { generateInitialDraft } from './services/ai';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async (prompt: string, attachments: string[]) => {
    setIsGenerating(true);
    try {
      const draft = await generateInitialDraft(prompt, attachments);
      setContent(draft);
    } catch (error) {
      console.error("Generation failed", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#FBFBFA]">
      <Sidebar onGenerate={handleGenerate} isGenerating={isGenerating} />
      
      <main className="flex-1 relative">
        <AnimatePresence mode="wait">
          {!content && !isGenerating ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center"
            >
              <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center mb-8">
                <span className="text-4xl">✨</span>
              </div>
              <h2 className="text-3xl font-serif font-bold mb-4">Your canvas awaits</h2>
              <p className="text-neutral-500 max-w-md leading-relaxed">
                Describe your vision in the sidebar or just start typing. 
                Muse will be here to help you refine every word.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="editor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full"
            >
              <Editor content={content} onUpdate={setContent} />
            </motion.div>
          )}
        </AnimatePresence>

        {isGenerating && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
            <div className="w-16 h-16 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin mb-6" />
            <p className="text-lg font-serif italic text-neutral-600 animate-pulse">
              Muse is weaving your thoughts into words...
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
