import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  Layout, 
  PenTool, 
  User, 
  Github, 
  Twitter, 
  Mail, 
  Plus, 
  X, 
  ChevronLeft, 
  Clock, 
  Image as ImageIcon,
  Send,
  Headphones,
  Mic,
  Play,
  Pause,
  Volume2,
  Sparkles,
  ArrowRight
} from 'lucide-react';

// --- 模拟数据：博客文章 ---
const INITIAL_POSTS = [
  {
    id: 1,
    title: "探索城市的光影瞬间",
    excerpt: "在繁忙的街道上，每个人都有自己的故事。这次我带上了相机，捕捉那些被遗忘的角落...",
    content: "这是一篇关于城市摄影的深度文章。在现代都市中，光影的变化赋予了建筑物生命。我发现清晨六点的阳光最为迷人，它斜射在老旧的磁砖墙上，营造出一种怀旧的氛围。\n\n当我们慢下脚步，会发现街角的咖啡厅、生锈的铁门、甚至是地上的雨水倒影，都充满了诗意。这就是摄影的魅力，让我们重新认识习以为常的世界。",
    image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&q=80&w=1000",
    date: "2023-12-25",
    category: "视觉日记",
    color: "bg-blue-100 text-blue-700"
  },
  {
    id: 2,
    title: "极简主义的生活美学",
    excerpt: "减少不必要的杂物，是为了让灵魂有更多空间去呼吸。分享我的居家改造心得...",
    content: "断舍离不只是丢掉东西，更是一种心态的整理。当我把书桌上多余的文具清除，只留下一盆绿植和一盏台灯时，我的专注力得到了显著提升。\n\n这篇文章记录了我从杂乱到极简的转变过程，希望能带给你一些启发。",
    image: "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?auto=format&fit=crop&q=80&w=1000",
    date: "2023-12-20",
    category: "生活方式",
    color: "bg-green-100 text-green-700"
  },
  {
    id: 3,
    title: "冬日里的温暖手冲咖啡",
    excerpt: "寒冷的午後，一杯耶加雪菲的香气足以抚平所有的焦虑。手冲咖啡的仪式感...",
    content: "水温 92 度，闷蒸 30 秒。看着咖啡粉在滤纸中微微隆起，释放出迷人的果香，这是我一天中最享受的时刻。\n\n每种豆子都有它的个性，水流的速度、研磨的粗细都会影响最终的味道。这就像生活一样，细节决定了品质。",
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=1000",
    date: "2023-12-15",
    category: "味蕾探索",
    color: "bg-orange-100 text-orange-700"
  }
];

// --- 模拟数据：音频播客 ---
const INITIAL_PODCASTS = [
  {
    id: 101,
    title: "EP01. 为什么我们需要「玩」？",
    description: "在效率至上的时代，重新找回玩乐的纯粹快乐。聊聊游戏化思维如何改变生活。",
    duration: "24:15",
    cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=1000",
    date: "2024-01-10",
    tags: ["思维", "生活"]
  },
  {
    id: 102,
    title: "EP02. 声音的风景：东京地铁录音",
    description: "戴上耳机，闭上眼睛。这是一集纯粹的声音纪录片，带你穿梭在东京的地下迷宫。",
    duration: "18:30",
    cover: "https://images.unsplash.com/photo-1596280846682-14f7b243449b?auto=format&fit=crop&q=80&w=1000",
    date: "2024-01-05",
    tags: ["ASMR", "旅行"]
  },
  {
    id: 103,
    title: "EP03. 数字游民的背包",
    description: "采访了三位在世界各地工作的设计师，看看他们的背包里都装了什么生产力工具。",
    duration: "32:00",
    cover: "https://images.unsplash.com/photo-1555421689-491a97ff2040?auto=format&fit=crop&q=80&w=1000",
    date: "2023-12-28",
    tags: ["访谈", "科技"]
  }
];

const App = () => {
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [podcasts, setPodcasts] = useState(INITIAL_PODCASTS);
  const [view, setView] = useState('home'); // 'home', 'detail', 'create'
  const [activeTab, setActiveTab] = useState('blog'); // 'blog', 'podcast'
  const [selectedPost, setSelectedPost] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // 音频播放器状态
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // 表单状态
  const [newPost, setNewPost] = useState({
    title: '',
    category: '视觉日记',
    image: '',
    excerpt: '',
    content: ''
  });

  // 切换播放状态
  const togglePlay = (track) => {
    if (currentTrack?.id === track.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
    }
  };

  // 切换到文章详情
  const openDetail = (post) => {
    setSelectedPost(post);
    setView('detail');
    window.scrollTo(0, 0);
  };

  // 提交新文章
  const handlePublish = (e) => {
    e.preventDefault();
    const postToAdd = {
      ...newPost,
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      color: "bg-purple-100 text-purple-700"
    };
    setPosts([postToAdd, ...posts]);
    setView('home');
    setActiveTab('blog');
    setNewPost({ title: '', category: '视觉日记', image: '', excerpt: '', content: '' });
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] font-sans selection:bg-[#0071E3] selection:text-white">
      {/* 导航栏 - Apple Style Frosted Glass */}
      <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-gray-200/50 transition-all duration-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-[52px] flex items-center justify-between">
          {/* Logo 区域 */}
          <div 
            className="flex items-center gap-2 cursor-pointer group hover:opacity-70 transition-opacity"
            onClick={() => setView('home')}
          >
            <Sparkles size={18} className="text-[#1D1D1F]" strokeWidth={2.5} />
            <span className="text-lg font-semibold tracking-tight text-[#1D1D1F]">Playxeld</span>
          </div>

          {/* 桌面导航 - Clean Pills */}
          <div className="hidden md:flex items-center gap-1 bg-gray-100/50 p-1 rounded-full">
            <button 
              onClick={() => { setView('home'); setActiveTab('blog'); }}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${view === 'home' && activeTab === 'blog' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}
            >
              图文博客
            </button>
            <button 
              onClick={() => { setView('home'); setActiveTab('podcast'); }}
              className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-300 ${view === 'home' && activeTab === 'podcast' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-black'}`}
            >
              音频播客
            </button>
          </div>

          <div className="hidden md:flex items-center">
            <button 
              onClick={() => setView('create')}
              className="bg-[#1D1D1F] text-white px-4 py-1.5 rounded-full text-xs font-medium hover:bg-black/80 transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>创作</span>
            </button>
          </div>

          {/* 手机菜单按钮 */}
          <button className="md:hidden text-[#1D1D1F]" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={20} /> : <Layout size={20} />}
          </button>
        </div>
        
        {/* 移动端菜单 */}
        {isMenuOpen && (
          <div className="md:hidden bg-white/95 backdrop-blur-xl border-b border-gray-100 p-6 space-y-4 absolute w-full animate-in fade-in slide-in-from-top-4 z-40">
            <button onClick={() => {setView('home'); setActiveTab('blog'); setIsMenuOpen(false);}} className="w-full text-left py-2 font-medium text-[#1D1D1F] border-b border-gray-100">
              图文博客
            </button>
            <button onClick={() => {setView('home'); setActiveTab('podcast'); setIsMenuOpen(false);}} className="w-full text-left py-2 font-medium text-[#1D1D1F] border-b border-gray-100">
              音频播客
            </button>
            <button 
              onClick={() => {setView('create'); setIsMenuOpen(false);}}
              className="w-full bg-[#0071E3] text-white p-3 rounded-xl font-medium flex items-center justify-center gap-2 mt-4"
            >
              <Plus size={18} />
              <span>开始创作</span>
            </button>
          </div>
        )}
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-16 pb-32">
        {/* 首页视图 */}
        {view === 'home' && (
          <div className="space-y-20 animate-in fade-in duration-700">
            {/* Hero Section - Apple Style Big Typography */}
            <section className="text-center space-y-6 py-12">
              <h1 className="text-5xl md:text-7xl font-semibold text-[#1D1D1F] tracking-tight leading-tight">
                All We Need Is Play.
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-500 max-w-2xl mx-auto leading-relaxed font-light">
                简单，纯粹，充满乐趣。<br/>这里是 Playxeld 的数字游乐场。
              </p>
            </section>

            {/* 内容区域：博客模式 */}
            {activeTab === 'blog' && (
              <div className="space-y-10">
                <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                  <h2 className="text-2xl font-semibold tracking-tight">最新文章</h2>
                  <div className="flex gap-2">
                    {['全部', '摄影', '生活', '美食'].map(tag => (
                      <button key={tag} className="px-3 py-1 rounded-full text-xs font-medium text-gray-500 hover:bg-gray-200 hover:text-black transition-colors">
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                  {posts.map(post => (
                    <article 
                      key={post.id} 
                      className="group cursor-pointer flex flex-col gap-4"
                      onClick={() => openDetail(post)}
                    >
                      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gray-100 shadow-sm transition-all duration-500 group-hover:shadow-md group-hover:scale-[1.01]">
                        <img 
                          src={post.image} 
                          alt={post.title} 
                          className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
                          onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1000"; }}
                        />
                        <div className="absolute top-3 left-3">
                          <span className="bg-white/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-semibold text-black uppercase tracking-wide">
                            {post.category}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-xs font-medium text-gray-400 uppercase tracking-wide">
                          <span>{post.date}</span>
                        </div>
                        <h3 className="text-xl font-semibold text-[#1D1D1F] group-hover:text-[#0071E3] transition-colors leading-snug">
                          {post.title}
                        </h3>
                        <p className="text-gray-500 text-sm line-clamp-2 leading-relaxed">
                          {post.excerpt}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            )}

            {/* 内容区域：播客模式 */}
            {activeTab === 'podcast' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-8">
                 <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                  <h2 className="text-2xl font-semibold tracking-tight">本周精选</h2>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {podcasts.map(podcast => (
                    <div 
                      key={podcast.id}
                      className={`relative bg-white rounded-2xl p-6 transition-all duration-300 flex flex-col md:flex-row gap-8 items-center group hover:bg-white hover:shadow-lg
                        ${currentTrack?.id === podcast.id ? 'shadow-md ring-1 ring-gray-200' : 'shadow-sm'}
                      `}
                    >
                      <div className="relative w-full md:w-40 aspect-square shrink-0 rounded-xl overflow-hidden bg-gray-100 shadow-inner group-hover:shadow-none transition-all">
                        <img src={podcast.cover} alt={podcast.title} className="w-full h-full object-cover" />
                        <button 
                          onClick={() => togglePlay(podcast)}
                          className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[1px]"
                        >
                          <div className="w-12 h-12 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-all">
                             {currentTrack?.id === podcast.id && isPlaying ? <Pause size={20} className="fill-black text-black"/> : <Play size={20} className="fill-black text-black ml-1"/>}
                          </div>
                        </button>
                      </div>
                      
                      <div className="flex-1 space-y-3 text-center md:text-left w-full">
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                           <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{podcast.date}</span>
                           <span className="text-gray-300">•</span>
                           <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{podcast.duration}</span>
                        </div>
                        
                        <div>
                          <h3 className="text-xl font-semibold text-[#1D1D1F] mb-1">{podcast.title}</h3>
                          <p className="text-gray-500 text-sm leading-relaxed">{podcast.description}</p>
                        </div>

                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-2">
                          {podcast.tags.map(tag => (
                            <span key={tag} className="px-2 py-0.5 rounded-md bg-gray-100 text-[10px] font-medium text-gray-600">#{tag}</span>
                          ))}
                        </div>
                      </div>
                      
                      <button 
                         onClick={() => togglePlay(podcast)}
                         className="hidden md:flex items-center justify-center w-10 h-10 rounded-full border border-gray-200 text-gray-400 hover:text-black hover:border-black transition-all"
                       >
                         {currentTrack?.id === podcast.id && isPlaying ? <Pause size={16} fill="currentColor"/> : <Play size={16} fill="currentColor" className="ml-0.5"/>}
                       </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 文章详情视图 */}
        {view === 'detail' && selectedPost && (
          <div className="max-w-3xl mx-auto space-y-12 animate-in fade-in zoom-in-95 duration-500">
            <button 
              onClick={() => setView('home')}
              className="flex items-center space-x-1 text-gray-500 hover:text-black transition-colors mb-4 group text-sm font-medium"
            >
              <ChevronLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
              <span>返回列表</span>
            </button>
            
            <div className="space-y-8 text-center">
               <div className="inline-block px-3 py-1 rounded-full bg-blue-50 text-[#0071E3] text-xs font-semibold tracking-wide uppercase">
                  {selectedPost.category}
               </div>
               <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-[#1D1D1F] leading-tight">
                  {selectedPost.title}
               </h1>
               <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                  <span className="font-medium text-gray-900">Playxeld 编辑部</span>
                  <span>•</span>
                  <span>{selectedPost.date}</span>
               </div>
            </div>

            <div className="rounded-3xl overflow-hidden shadow-sm aspect-[21/10]">
              <img 
                src={selectedPost.image} 
                alt={selectedPost.title} 
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="prose prose-lg prose-slate max-w-none mx-auto">
                 <p className="text-xl text-gray-600 font-light leading-relaxed mb-10 border-l-2 border-[#0071E3] pl-6">
                   {selectedPost.excerpt}
                 </p>
                 {selectedPost.content.split('\n').map((para, i) => (
                   <p key={i} className="text-[#1D1D1F] leading-8 mb-6 text-lg font-light tracking-wide">
                     {para}
                   </p>
                 ))}
            </div>
          </div>
        )}

        {/* 发布视图 */}
        {view === 'create' && (
          <div className="max-w-2xl mx-auto bg-white p-8 md:p-12 rounded-3xl shadow-xl animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100">
              <h2 className="text-2xl font-semibold text-[#1D1D1F]">
                创作新内容
              </h2>
              <button onClick={() => setView('home')} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            
            <form onSubmit={handlePublish} className="space-y-8">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">标题</label>
                <input 
                  type="text" 
                  required
                  placeholder="请输入标题..."
                  className="w-full py-2 bg-transparent border-b border-gray-200 focus:border-[#0071E3] outline-none transition-all text-xl font-medium placeholder:text-gray-300 placeholder:font-light"
                  value={newPost.title}
                  onChange={e => setNewPost({...newPost, title: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">分类</label>
                  <select 
                    className="w-full py-2 bg-transparent border-b border-gray-200 focus:border-[#0071E3] outline-none font-medium"
                    value={newPost.category}
                    onChange={e => setNewPost({...newPost, category: e.target.value})}
                  >
                    <option>视觉日记</option>
                    <option>生活方式</option>
                    <option>味蕾探索</option>
                    <option>灵感笔记</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">封面链接</label>
                  <input 
                    type="url" 
                    placeholder="https://..."
                    className="w-full py-2 bg-transparent border-b border-gray-200 focus:border-[#0071E3] outline-none transition-all font-light"
                    value={newPost.image}
                    onChange={e => setNewPost({...newPost, image: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">摘要</label>
                <input 
                  type="text" 
                  required
                  placeholder="简短的介绍..."
                  className="w-full py-2 bg-transparent border-b border-gray-200 focus:border-[#0071E3] outline-none font-light"
                  value={newPost.excerpt}
                  onChange={e => setNewPost({...newPost, excerpt: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">正文</label>
                <textarea 
                  required
                  rows="8"
                  placeholder="开始书写..."
                  className="w-full py-2 bg-transparent border-b border-gray-200 focus:border-[#0071E3] outline-none resize-none leading-relaxed font-light"
                  value={newPost.content}
                  onChange={e => setNewPost({...newPost, content: e.target.value})}
                ></textarea>
              </div>

              <div className="pt-4">
                 <button 
                  type="submit"
                  className="w-full bg-[#0071E3] text-white py-4 rounded-xl font-medium text-sm hover:bg-[#0077ED] transition-colors shadow-lg shadow-blue-100 active:scale-[0.99]"
                >
                  发布作品
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* 固定底部播放器 - Frosted Glass Dock Style */}
      {currentTrack && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-4xl bg-white/80 backdrop-blur-2xl border border-white/20 p-3 rounded-2xl shadow-2xl z-50 animate-in slide-in-from-bottom-20 flex items-center gap-4">
           <img src={currentTrack.cover} className="w-12 h-12 rounded-lg object-cover shadow-sm" alt="cover"/>
           
           <div className="flex-1 min-w-0 flex flex-col justify-center">
              <h4 className="font-semibold text-sm text-[#1D1D1F] truncate">{currentTrack.title}</h4>
              <p className="text-[10px] text-gray-500 font-medium truncate uppercase tracking-wide">正在播放 • {currentTrack.duration}</p>
           </div>

           <div className="flex items-center gap-4 px-2">
               <button className="text-gray-400 hover:text-black transition-colors"><ChevronLeft size={20} className="rotate-180"/></button>
               <button 
                 onClick={() => setIsPlaying(!isPlaying)}
                 className="w-10 h-10 bg-[#1D1D1F] text-white rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-md"
               >
                  {isPlaying ? <Pause size={16} fill="currentColor"/> : <Play size={16} fill="currentColor" className="ml-0.5"/>}
               </button>
               <button className="text-gray-400 hover:text-black transition-colors"><ChevronLeft size={20}/></button>
           </div>
           
           <button onClick={() => setCurrentTrack(null)} className="p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-colors">
             <X size={16}/>
           </button>
        </div>
      )}

      {/* 页脚 - Minimalist */}
      <footer className="bg-white border-t border-gray-100 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[#1D1D1F]">
                <Sparkles size={16} />
                <span className="font-semibold tracking-tight">Playxeld</span>
              </div>
              <p className="text-xs text-gray-400 max-w-xs leading-relaxed">
                致力于探索生活乐趣的内容平台。<br/>好设计与好故事，值得被看见。
              </p>
            </div>
            
            <div className="flex gap-8 text-xs font-medium text-gray-500">
               <button className="hover:text-[#0071E3] transition-colors">关于我们</button>
               <button className="hover:text-[#0071E3] transition-colors">隐私政策</button>
               <button className="hover:text-[#0071E3] transition-colors">服务条款</button>
            </div>

            <div className="flex gap-4">
               <button className="text-gray-400 hover:text-black transition-colors"><Twitter size={16}/></button>
               <button className="text-gray-400 hover:text-black transition-colors"><Github size={16}/></button>
               <button className="text-gray-400 hover:text-black transition-colors"><Mail size={16}/></button>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-gray-50 text-center text-[10px] text-gray-300">
            Copyright © 2024 Playxeld Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
