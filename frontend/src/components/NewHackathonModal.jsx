import React, { useState } from 'react';
import { createHackathon } from '../firebase/functions';

export default function NewHackathonModal({ isOpen, onClose, teamId = "default-team" }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    theme: '',
    startDate: '',
    endDate: '',
    registrationDeadline: '',
    submissionDeadline: '',
    status: 'Yet to register'
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createHackathon(teamId, formData);
      onClose();
      // Optionally trigger a refresh or callback here
    } catch (error) {
      console.error("Error creating hackathon:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#1e293b] w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">New Hackathon</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Add a new hackathon to your workspace</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-500 dark:text-slate-400">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="overflow-y-auto p-6 custom-scrollbar">
          <form id="hackathon-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Basic Info</h3>
              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Hackathon Name</label>
                  <input
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white"
                    placeholder="e.g. Global AI Challenge 2024"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Short Description</label>
                  <textarea
                    name="description"
                    required
                    value={formData.description}
                    onChange={handleChange}
                    rows="3"
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white resize-none"
                    placeholder="What is this hackathon about?"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Theme / Domain <span className="font-normal text-slate-400">(Optional)</span></label>
                  <input
                    name="theme"
                    value={formData.theme}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white"
                    placeholder="e.g. AI, Sustainability, Fintech"
                  />
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Timeline</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    name="startDate"
                    required
                    value={formData.startDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">End Date & Time</label>
                  <input
                    type="datetime-local"
                    name="endDate"
                    required
                    value={formData.endDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Registration Deadline</label>
                  <input
                    type="datetime-local"
                    name="registrationDeadline"
                    value={formData.registrationDeadline}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Submission Deadline</label>
                  <input
                    type="datetime-local"
                    name="submissionDeadline"
                    value={formData.submissionDeadline}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Status */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Status</h3>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Current Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white appearance-none"
                >
                  <option value="Yet to register">Yet to register</option>
                  <option value="Registered">Registered</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>
          </form>
        </div>

        <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex justify-end gap-3">
          <button
            onClick={onClose}
            type="button"
            className="px-5 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            form="hackathon-form"
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 text-sm font-semibold bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-50"
          >
            {loading && <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>}
            {loading ? 'Creating...' : 'Create Hackathon'}
          </button>
        </div>
      </div>
    </div>
  );
}
