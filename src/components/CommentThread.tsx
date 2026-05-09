
import React, { useState, useEffect } from 'react';
import { MessageSquare, Send, User, Clock, X, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ProjectComment } from '../types';
import { auth, db, OperationType, handleFirestoreError } from '../firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';

interface CommentThreadProps {
  itemId: string;
  itemLabel: string;
  onClose?: () => void;
  budgetId: string;
}

export const CommentThread: React.FC<CommentThreadProps> = ({ itemId, itemLabel, onClose, budgetId }) => {
  const [comments, setComments] = useState<ProjectComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!budgetId) return;

    const q = query(
      collection(db, 'budgets', budgetId, 'comments'),
      where('itemId', '==', itemId),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedComments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ProjectComment[];
      setComments(fetchedComments);
      setIsLoading(false);
    }, (error) => {
        handleFirestoreError(error, OperationType.LIST, `budgets/${budgetId}/comments`);
    });

    return () => unsubscribe();
  }, [itemId, budgetId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !auth.currentUser) return;

    try {
      const commentData = {
        itemId,
        authorId: auth.currentUser.uid,
        authorName: auth.currentUser.displayName || auth.currentUser.email || 'Anonym',
        text: newComment,
        timestamp: Date.now()
      };

      await addDoc(collection(db, 'budgets', budgetId, 'comments'), commentData);
      setNewComment('');
    } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `budgets/${budgetId}/comments`);
    }
  };

  const deleteComment = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'budgets', budgetId, 'comments', id));
    } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `budgets/${budgetId}/comments/${id}`);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-xl text-blue-600">
            <MessageSquare size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-tight text-slate-900 leading-tight">Kommentarer</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">{itemLabel}</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg text-slate-400">
            <X size={16} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {comments.map((comment) => (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={comment.id} 
            className="flex gap-4 group"
          >
            <div className="shrink-0 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
              <User size={14} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold uppercase text-slate-900">{comment.authorName}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                    <Clock size={10} />
                    {new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {auth.currentUser?.uid === comment.authorId && (
                    <button 
                      onClick={() => deleteComment(comment.id)}
                      className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all px-1"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                {comment.text}
              </p>
            </div>
          </motion.div>
        ))}

        {comments.length === 0 && !isLoading && (
          <div className="h-full flex flex-col items-center justify-center py-20 text-center">
            <MessageSquare size={32} className="text-slate-100 mb-4" />
            <p className="text-xs text-slate-400 font-medium">Inga kommentarer än. Börja konversationen!</p>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-slate-100 bg-slate-50/30">
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Skriv din kommentar..."
            className="w-full bg-white border border-slate-200 rounded-2xl px-5 py-4 text-sm font-medium pr-14 min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
          />
          <button
            type="submit"
            disabled={!newComment.trim()}
            className="absolute bottom-4 right-4 bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-500 disabled:opacity-30 transition-all shadow-lg active:scale-95"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};
