import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function ProfileSetup() {
    const navigate = useNavigate();

    const handleComplete = () => {
        // Mock profile completion - navigate to teams selection
        navigate('/teams/select');
    };

    return (
        <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-white min-h-screen flex items-center justify-center">
            <div className="w-full max-w-[440px] p-6">
                <div className="mb-10 text-center">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Complete Your Profile</h2>
                    <p className="text-slate-500 dark:text-slate-400">Let your teammates know who you are</p>
                </div>

                <div className="space-y-8">
                    {/* Avatar Selection */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">Choose an Avatar</label>
                        <div className="flex flex-wrap gap-4 justify-center sm:justify-between">
                            <button className="w-16 h-16 rounded-full border-4 border-primary bg-primary/20 flex items-center justify-center overflow-hidden relative group">
                                <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDcWyzMAsCPLpZ6F5wDGWgl5utTSeSAjmkBmg4m-Nc43sLyCpxJPU3RGxkCls01Ejs1Kx4aGNA7eEKwVsPW2KCGpSRwx0jTANVhfvHO5xmXVWQ_irNkzGdtXcmeo7_sY1kMSrVAVnZWEqG-SE_MW6SFy3Cl08-ZJMF5AMHufVEvnHeV42UJ8aHbmOt12t63D0vtC6x3iQPVMC61WjBNg_Bzh-n28on_IpotZvHpfW1J13vwhTFZgzOp8ijGtJImZRfe4wbpQd9Q-thj')" }}></div>
                                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-white">check_circle</span>
                                </div>
                            </button>
                            <button className="w-16 h-16 rounded-full border-2 border-slate-200 dark:border-[#3b4354] bg-slate-100 dark:bg-[#1c1f27] hover:border-primary/50 transition-all overflow-hidden">
                                <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAzWrirJgtxSF0FdgS_HigzjIWsbD50m7n7WZRN_ZjkAheN__0vsVimGG6FljitgSivG3hnJyqm09XGOEsXEGLx-FPb0eEMW6Y3BML-3Q7gnx9JVpbEQYmWwEJOPxEBm7btoIaDesxslqDgsshNcmidTd2kXvOY2IcGnT4Ns__iIZaoUxrnRD48povjBGaW7rxSXlL5gYp2ZxlkpKu6sJN6E0LBT4cd7wgJHRRqYrGXYKwtWFmlQsfM8JnivIzXE5U7E-nBlQdKBNnC')" }}></div>
                            </button>
                            <button className="w-16 h-16 rounded-full border-2 border-slate-200 dark:border-[#3b4354] bg-slate-100 dark:bg-[#1c1f27] hover:border-primary/50 transition-all overflow-hidden">
                                <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBuLZBFoKO5nQWFU0xhL8DdW8RQYcV7uOWgw5TgLt3kSkCqXBURoIVqQDwOWT3TkFLe7wBmZr-hNqBawlfzsst9P4xtZu6ikFF33Ag_exZy8mCcsvw7wtOOsPOvsWY9CuZ4Vw0BrKP49QDuCapUcZa3UblbomcXzkPbOkxy8W6uFDwISSvsOC0n_SqtcWq7VM94oZuEXPJnrkX9vWM4ME1ohUpoTFDXiEicVyWRgj0N5SWcPXVfMRPzvRawN2lt539nK-gqK3mNV2J6')" }}></div>
                            </button>
                            <button className="w-16 h-16 rounded-full border-2 border-dashed border-slate-300 dark:border-[#3b4354] flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary transition-all">
                                <span className="material-symbols-outlined">add_a_photo</span>
                            </button>
                        </div>
                    </div>

                    {/* Username */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Choose Username</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">@</span>
                            <input className="w-full pl-10 pr-4 py-3.5 bg-white dark:bg-[#1c1f27] border border-slate-200 dark:border-[#3b4354] rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" placeholder="username" type="text" />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 text-emerald-500 text-xs font-bold">
                                <span class="material-symbols-outlined text-[16px]">check_circle</span>
                                Available
                            </div>
                        </div>
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Your unique handle for mentions and profile.</p>
                    </div>

                    {/* Role/Tag Selection */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Primary Role</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button className="px-4 py-2 text-sm font-medium border-2 border-primary bg-primary/10 text-primary rounded-lg">Developer</button>
                            <button className="px-4 py-2 text-sm font-medium border-2 border-slate-200 dark:border-[#3b4354] text-slate-600 dark:text-slate-400 rounded-lg hover:border-slate-300 dark:hover:border-slate-600 transition-colors">Designer</button>
                            <button className="px-4 py-2 text-sm font-medium border-2 border-slate-200 dark:border-[#3b4354] text-slate-600 dark:text-slate-400 rounded-lg hover:border-slate-300 dark:hover:border-slate-600 transition-colors">Product</button>
                            <button className="px-4 py-2 text-sm font-medium border-2 border-slate-200 dark:border-[#3b4354] text-slate-600 dark:text-slate-400 rounded-lg hover:border-slate-300 dark:hover:border-slate-600 transition-colors">Marketing</button>
                        </div>
                    </div>

                    <button onClick={handleComplete} className="w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-lg font-bold text-lg shadow-lg shadow-primary/25 transition-all">
                        Complete Setup
                    </button>
                </div>

                <div className="mt-12 pt-8 border-t border-slate-100 dark:border-[#3b4354]/30 flex justify-between items-center text-xs text-slate-400 font-medium">
                    <div className="flex gap-4">
                        <a className="hover:text-primary" href="#">Privacy Policy</a>
                        <a className="hover:text-primary" href="#">Terms of Service</a>
                    </div>
                    <span>© 2024 DevSprint Inc.</span>
                </div>
            </div>
        </div>
    );
}
