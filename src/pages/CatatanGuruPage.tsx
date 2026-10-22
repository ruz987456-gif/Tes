import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { MessageSquare, User, Calendar, Quote } from 'lucide-react';

export const CatatanGuruPage: React.FC = () => {
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const res = await api.getAttendance();
      setNotes(res.notes || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-24">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-amber-400" />
          <h1 className="text-2xl font-black text-white">Catatan & Motivasi Guru</h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Nasihat dan evaluasi perkembangan tahfiz dari ustadz/ustadzah pembina halaqah.
        </p>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Memuat catatan...</div>
      ) : notes.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800">
          <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-300">Belum Ada Catatan</h3>
          <p className="text-xs text-slate-400 mt-1">
            Ustadz pembina akan memberikan bimbingan dan catatan motivasi hafalan di sini.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => (
            <div
              key={note.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-md flex items-start gap-4 relative overflow-hidden"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
                <Quote className="w-5 h-5" />
              </div>

              <div className="space-y-2 flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <h4 className="text-xs font-bold text-amber-400">{note.teacherName || 'Ustadz Pembina'}</h4>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(note.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })} WITA
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed italic bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
                  "{note.message}"
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
