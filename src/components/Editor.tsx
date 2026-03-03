import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu as BubbleMenuComponent } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import BubbleMenu from '@tiptap/extension-bubble-menu';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Wand2, Check, X, MessageSquare } from 'lucide-react';
import { iterateOnText, getProactiveFeedback, AISuggestion } from '../services/ai';

interface EditorProps {
  content: string;
  onUpdate: (content: string) => void;
}

export function Editor({ content, onUpdate }: EditorProps) {
  const [isIterating, setIsIterating] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [proactiveSuggestions, setProactiveSuggestions] = useState<AISuggestion[]>([]);
  const [activeSuggestion, setActiveSuggestion] = useState<AISuggestion | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start writing your masterpiece...',
      }),
      Highlight.configure({
        multicolor: true,
      }),
      BubbleMenu.configure({
        element: null, // Will be managed by the component
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Proactive feedback logic
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!editor || editor.getText().length < 50) return;
      
      const suggestions = await getProactiveFeedback(editor.getText());
      setProactiveSuggestions(suggestions);
    }, 5000); // Check every 5 seconds of inactivity

    return () => clearTimeout(timer);
  }, [editor?.getHTML()]);

  const handleIterate = async () => {
    if (!editor || !feedback) return;

    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to);
    
    if (!selectedText) return;

    setIsIterating(true);
    try {
      const rewritten = await iterateOnText(editor.getText(), selectedText, feedback);
      editor.chain().focus().insertContentAt({ from, to }, rewritten).run();
      setFeedback('');
    } catch (error) {
      console.error(error);
    } finally {
      setIsIterating(false);
    }
  };

  const applySuggestion = (suggestion: AISuggestion) => {
    if (!editor) return;
    
    const text = editor.getText();
    const index = text.indexOf(suggestion.originalText);
    
    if (index !== -1) {
      const currentContent = editor.getHTML();
      const updated = currentContent.replace(suggestion.originalText, suggestion.suggestedText);
      editor.commands.setContent(updated);
    }
    setProactiveSuggestions(prev => prev.filter(s => s !== suggestion));
    setActiveSuggestion(null);
  };

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-[#FBFBFA] relative">
      <div className="max-w-3xl mx-auto px-8 py-20">
        {editor && (
          <BubbleMenuComponent editor={editor}>
            <div className="bg-white rounded-2xl shadow-2xl border border-neutral-200 p-2 flex flex-col gap-2 min-w-[300px]">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-neutral-100">
                <Wand2 className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Iterate with Muse
                </span>
              </div>
              <div className="p-2">
                <textarea
                  autoFocus
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="How should I change this? (e.g., 'make it more punchy', 'fix the tone')"
                  className="w-full p-3 bg-neutral-50 rounded-xl border-none text-sm focus:ring-0 resize-none h-24"
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={handleIterate}
                    disabled={isIterating || !feedback}
                    className="px-4 py-2 bg-neutral-900 text-white rounded-lg text-xs font-medium hover:bg-neutral-800 disabled:opacity-50 flex items-center gap-2 transition-all"
                  >
                    {isIterating ? (
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Sparkles className="w-3 h-3" />
                    )}
                    Rewrite
                  </button>
                </div>
              </div>
            </div>
          </BubbleMenuComponent>
        )}

        <EditorContent editor={editor} className="font-serif" />
      </div>

      {/* Proactive Suggestions UI */}
      <div className="fixed right-8 top-1/2 -translate-y-1/2 flex flex-col gap-4">
        <AnimatePresence>
          {proactiveSuggestions.map((suggestion, i) => (
            <motion.button
              key={i}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={() => setActiveSuggestion(suggestion)}
              className="w-12 h-12 bg-white rounded-full shadow-lg border border-emerald-100 flex items-center justify-center text-emerald-500 hover:bg-emerald-50 transition-all group relative"
            >
              <MessageSquare className="w-5 h-5" />
              <span className="absolute right-full mr-4 bg-neutral-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                AI Suggestion
              </span>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>

      {/* Suggestion Modal */}
      <AnimatePresence>
        {activeSuggestion && (
          <div className="fixed inset-0 bg-black/5 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl border border-neutral-200 w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-500" />
                  <h3 className="font-semibold">Muse Suggestion</h3>
                </div>
                <button onClick={() => setActiveSuggestion(null)} className="p-2 hover:bg-neutral-100 rounded-full">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="p-8 space-y-6">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 mb-2 block">Original</label>
                  <p className="text-neutral-500 italic line-through decoration-neutral-300">{activeSuggestion.originalText}</p>
                </div>
                
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-2 block">Suggested</label>
                  <p className="text-lg font-serif leading-relaxed">{activeSuggestion.suggestedText}</p>
                </div>

                <div className="bg-emerald-50/50 p-4 rounded-2xl">
                  <p className="text-xs text-emerald-700 leading-relaxed">
                    <span className="font-bold">Why: </span>
                    {activeSuggestion.explanation}
                  </p>
                </div>
              </div>

              <div className="p-6 bg-neutral-50 flex gap-3">
                <button
                  onClick={() => applySuggestion(activeSuggestion)}
                  className="flex-1 py-3 bg-neutral-900 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-neutral-800 transition-all"
                >
                  <Check className="w-4 h-4" />
                  Apply Change
                </button>
                <button
                  onClick={() => setActiveSuggestion(null)}
                  className="px-6 py-3 bg-white border border-neutral-200 rounded-xl font-medium hover:bg-neutral-50 transition-all"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
