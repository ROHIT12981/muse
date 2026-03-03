import React, { useState } from 'react';
import { Sparkles, Paperclip, X, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  onGenerate: (prompt: string, files: string[]) => void;
  isGenerating: boolean;
}

export function Sidebar({ onGenerate, isGenerating }: SidebarProps) {
  const [prompt, setPrompt] = useState('');
  const [files, setFiles] = useState<{ name: string; content: string }[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;

    Array.from(fileList).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFiles(prev => [...prev, { name: file.name, content: event.target?.result as string }]);
      };
      reader.readAsText(file);
    });
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="w-80 border-r border-neutral-200 h-screen flex flex-col bg-white overflow-hidden">
      <div className="p-6 border-b border-neutral-100">
        <h1 className="text-xl font-serif font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-500" />
          Muse
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        <section>
          <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-3 block">
            Initial Concept
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="What are we writing today?"
            className="w-full h-40 p-4 bg-neutral-50 rounded-xl border-none focus:ring-2 focus:ring-emerald-500/20 resize-none text-sm leading-relaxed"
          />
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
              Context & Files
            </label>
            <label className="cursor-pointer hover:text-emerald-600 transition-colors">
              <Paperclip className="w-4 h-4" />
              <input type="file" multiple className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
          
          <div className="space-y-2">
            <AnimatePresence>
              {files.map((file, i) => (
                <motion.div
                  key={file.name + i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg group"
                >
                  <span className="text-xs text-neutral-600 truncate max-w-[180px]">
                    {file.name}
                  </span>
                  <button
                    onClick={() => removeFile(i)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-neutral-200 rounded transition-all"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
            {files.length === 0 && (
              <p className="text-xs text-neutral-400 italic">No files attached</p>
            )}
          </div>
        </section>
      </div>

      <div className="p-6 border-t border-neutral-100">
        <button
          disabled={!prompt || isGenerating}
          onClick={() => onGenerate(prompt, files.map(f => f.content))}
          className="w-full py-3 bg-neutral-900 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isGenerating ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Send className="w-4 h-4" />
              Generate Draft
            </>
          )}
        </button>
      </div>
    </div>
  );
}
