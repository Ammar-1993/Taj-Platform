<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>منصة تاج التعليمية — البوابة السحابية الرسمية</title>
    
    <!-- Favicon -->
    <link rel="icon" href="https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/1f451.svg" type="image/svg+xml">

    <!-- Fonts: Bunny CDN is whitelisted in Nginx CSP (works in both production & local) -->
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=cairo:400,500,600,700,800,900&display=swap" rel="stylesheet" />

    <!-- Compiled Vite Assets (if available) -->
    @if(file_exists(public_path('build/manifest.json')))
        @vite(['resources/css/app.css', 'resources/js/app.js'])
    @endif

    <style>
        /* ── Base & Typography ────────────────────────────────────────── */
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: 'Cairo', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background-color: #f8fafc;
            color: #0f172a;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1.25rem;
            position: relative;
            overflow-x: hidden;
            -webkit-font-smoothing: antialiased;
        }

        /* ── Subtle Technical Dot Grid ────────────────────────────────── */
        .bg-grid {
            position: fixed;
            inset: 0;
            width: 100%;
            height: 100%;
            background-image: radial-gradient(rgba(99, 102, 241, 0.12) 1px, transparent 1px);
            background-size: 28px 28px;
            pointer-events: none;
            z-index: 0;
        }

        /* ── Ambient Floating Blobs ───────────────────────────────────── */
        .blob {
            position: absolute;
            border-radius: 9999px;
            filter: blur(100px);
            mix-blend-mode: multiply;
            opacity: 0.45;
            pointer-events: none;
            animation: blobFloat 12s infinite alternate ease-in-out;
        }

        .blob-1 {
            top: -5%;
            right: -5%;
            width: 28rem;
            height: 28rem;
            background: linear-gradient(135deg, #a855f7, #6366f1);
            animation-delay: 0s;
        }

        .blob-2 {
            bottom: -10%;
            left: -5%;
            width: 32rem;
            height: 32rem;
            background: linear-gradient(135deg, #38bdf8, #818cf8);
            animation-delay: 3s;
        }

        .blob-3 {
            top: 40%;
            left: 30%;
            width: 24rem;
            height: 24rem;
            background: linear-gradient(135deg, #c084fc, #38bdf8);
            animation-delay: 6s;
        }

        @keyframes blobFloat {
            0% { transform: translate(0px, 0px) scale(1); }
            50% { transform: translate(25px, -35px) scale(1.08); }
            100% { transform: translate(-20px, 25px) scale(0.95); }
        }

        /* ── Glassmorphism Card ───────────────────────────────────────── */
        .glass-card {
            position: relative;
            z-index: 10;
            width: 100%;
            max-w-md: 32rem;
            background: rgba(255, 255, 255, 0.78);
            backdrop-filter: blur(28px);
            -webkit-backdrop-filter: blur(28px);
            border: 1px solid rgba(255, 255, 255, 0.9);
            box-shadow: 
                0 25px 50px -12px rgba(99, 102, 241, 0.12),
                0 0 0 1px rgba(226, 232, 240, 0.6),
                inset 0 1px 2px rgba(255, 255, 255, 0.9);
            border-radius: 2.5rem;
            padding: 2.75rem 2.25rem 2rem;
            animation: cardEntrance 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @media (min-width: 640px) {
            .glass-card {
                padding: 3.25rem 2.75rem 2.25rem;
                max-width: 31rem;
            }
        }

        @keyframes cardEntrance {
            from {
                opacity: 0;
                transform: translateY(30px) scale(0.97);
            }
            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }
        }

        /* ── Royal Crown Badge ────────────────────────────────────────── */
        .crown-container {
            width: 6rem;
            height: 6rem;
            margin: 0 auto 1.75rem;
            border-radius: 1.75rem;
            background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 50%, #9333ea 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            box-shadow: 
                0 18px 36px -10px rgba(79, 70, 229, 0.45),
                0 0 0 1px rgba(255, 255, 255, 0.35),
                inset 0 2px 4px rgba(255, 255, 255, 0.4);
            animation: floatGently 6s ease-in-out infinite;
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }

        .crown-container:hover {
            transform: translateY(-4px) scale(1.04);
            box-shadow: 0 24px 44px -8px rgba(79, 70, 229, 0.55);
        }

        @keyframes floatGently {
            0% { transform: translateY(0px) rotate(1deg); }
            50% { transform: translateY(-10px) rotate(-1deg); }
            100% { transform: translateY(0px) rotate(1deg); }
        }

        /* ── Typography & Gradients ───────────────────────────────────── */
        .title-gradient {
            background: linear-gradient(135deg, #0f172a 0%, #312e81 50%, #1e1b4b 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            font-size: 2rem;
            font-weight: 900;
            letter-spacing: -0.02em;
            line-height: 1.25;
            text-align: center;
        }

        @media (min-width: 640px) {
            .title-gradient {
                font-size: 2.25rem;
            }
        }

        .subtitle {
            color: #64748b;
            font-size: 0.95rem;
            font-weight: 600;
            text-align: center;
            margin-top: 0.5rem;
            margin-bottom: 1.5rem;
            line-height: 1.5;
        }

        /* ── Status Beacon ────────────────────────────────────────────── */
        .status-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            background: rgba(255, 255, 255, 0.85);
            border: 1px solid rgba(16, 185, 129, 0.25);
            padding: 0.4rem 1rem;
            border-radius: 9999px;
            box-shadow: 0 2px 8px rgba(16, 185, 129, 0.08);
            margin-bottom: 1.75rem;
        }

        .pulse-dot-wrapper {
            position: relative;
            display: flex;
            width: 0.65rem;
            height: 0.65rem;
        }

        .pulse-dot-ping {
            position: absolute;
            width: 100%;
            height: 100%;
            border-radius: 9999px;
            background-color: #10b981;
            opacity: 0.75;
            animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }

        .pulse-dot-core {
            position: relative;
            display: inline-flex;
            width: 0.65rem;
            height: 0.65rem;
            border-radius: 9999px;
            background-color: #059669;
        }

        @keyframes ping {
            75%, 100% {
                transform: scale(2.2);
                opacity: 0;
            }
        }

        .status-text {
            font-size: 0.825rem;
            font-weight: 800;
            color: #065f46;
            letter-spacing: 0.01em;
        }

        /* ── Action Buttons ───────────────────────────────────────────── */
        .btn-primary {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            width: 100%;
            padding: 1.05rem 1.5rem;
            background: linear-gradient(135deg, #4f46e5 0%, #6366f1 40%, #8b5cf6 100%);
            color: #ffffff;
            font-size: 1.075rem;
            font-weight: 800;
            border-radius: 1.15rem;
            text-decoration: none;
            box-shadow: 0 12px 28px -6px rgba(79, 70, 229, 0.45), inset 0 1px 1px rgba(255, 255, 255, 0.35);
            transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
            position: relative;
            overflow: hidden;
            border: none;
        }

        .btn-primary::after {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
            transform: translateX(-100%);
            transition: transform 0.6s ease;
        }

        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 18px 36px -6px rgba(79, 70, 229, 0.55);
        }

        .btn-primary:hover::after {
            transform: translateX(100%);
        }

        .btn-primary:active {
            transform: translateY(0);
        }

        .btn-primary svg {
            transition: transform 0.25s ease;
        }

        .btn-primary:hover svg {
            transform: translate(-3px, -3px);
        }

        .btn-secondary {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.65rem;
            width: 100%;
            padding: 0.9rem 1.5rem;
            background: rgba(241, 245, 249, 0.7);
            color: #475569;
            font-size: 0.95rem;
            font-weight: 700;
            border-radius: 1.15rem;
            text-decoration: none;
            border: 1px solid rgba(203, 213, 225, 0.6);
            transition: all 0.25s ease;
            margin-top: 0.75rem;
        }

        .btn-secondary:hover {
            background: rgba(255, 255, 255, 0.95);
            color: #1e293b;
            border-color: rgba(99, 102, 241, 0.3);
            box-shadow: 0 6px 18px -4px rgba(15, 23, 42, 0.08);
            transform: translateY(-1px);
        }

        /* ── Pillars Grid ─────────────────────────────────────────────── */
        .pillars-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 0.5rem;
            margin-top: 1.75rem;
            padding-top: 1.5rem;
            border-top: 1px solid rgba(226, 232, 240, 0.8);
        }

        .pillar-card {
            background: rgba(255, 255, 255, 0.6);
            border: 1px solid rgba(241, 245, 249, 0.9);
            border-radius: 0.9rem;
            padding: 0.65rem 0.4rem;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.35rem;
            transition: all 0.2s ease;
        }

        .pillar-card:hover {
            background: #ffffff;
            transform: translateY(-2px);
            box-shadow: 0 6px 14px -3px rgba(99, 102, 241, 0.1);
        }

        .pillar-icon-box {
            width: 1.85rem;
            height: 1.85rem;
            border-radius: 0.55rem;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .pillar-title {
            font-size: 0.75rem;
            font-weight: 800;
            color: #334155;
        }

        .pillar-desc {
            font-size: 0.65rem;
            font-weight: 600;
            color: #94a3b8;
        }

        /* ── Footer Badges ────────────────────────────────────────────── */
        .footer-bar {
            margin-top: 1.5rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 0.75rem;
            font-weight: 700;
        }

        .badge-version {
            color: #64748b;
            background: rgba(241, 245, 249, 0.8);
            border: 1px solid rgba(226, 232, 240, 0.8);
            padding: 0.3rem 0.65rem;
            border-radius: 0.6rem;
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
        }

        .badge-secure {
            color: #059669;
            background: rgba(236, 253, 245, 0.85);
            border: 1px solid rgba(167, 243, 208, 0.7);
            padding: 0.3rem 0.65rem;
            border-radius: 0.6rem;
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
        }
    </style>
</head>
<body>

    <!-- Ambient Tech Grid & Background Gradients -->
    <div class="bg-grid"></div>
    <div class="blob blob-1"></div>
    <div class="blob blob-2"></div>
    <div class="blob blob-3"></div>

    <!-- Main Glassmorphism Card -->
    <main class="glass-card">

        <!-- Royal Crown Emblem (Self-contained SVG, Zero Network Dependency) -->
        <div class="crown-container" title="منصة تاج التعليمية">
            <svg width="52" height="52" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <!-- Royal Crown Base Shadow -->
                <path d="M7 36H41C41.5523 36 42 36.4477 42 37V39C42 39.5523 41.5523 40 41 40H7C6.44772 40 6 39.5523 6 39V37C6 36.4477 6.44772 36 7 36Z" fill="#F59E0B" fill-opacity="0.5"/>
                <!-- Royal Crown Head -->
                <path d="M6 35L10 16L18 25L24 10L30 25L38 16L42 35H6Z" fill="url(#crownGoldGradient)" stroke="#FEF3C7" stroke-width="1.5" stroke-linejoin="round"/>
                <!-- Crown Base Arch -->
                <path d="M6 35C6 33.8954 6.89543 33 8 33H40C41.1046 33 42 33.8954 42 35V38H6V35Z" fill="url(#crownBaseGradient)"/>
                <!-- Jewels -->
                <circle cx="24" cy="10" r="2.5" fill="#EF4444" stroke="#FFF" stroke-width="1"/>
                <circle cx="10" cy="16" r="2" fill="#3B82F6" stroke="#FFF" stroke-width="1"/>
                <circle cx="38" cy="16" r="2" fill="#3B82F6" stroke="#FFF" stroke-width="1"/>
                <circle cx="16" cy="35.5" r="1.5" fill="#10B981"/>
                <circle cx="24" cy="35.5" r="1.5" fill="#EF4444"/>
                <circle cx="32" cy="35.5" r="1.5" fill="#10B981"/>
                <!-- Highlights & Definitions -->
                <defs>
                    <linearGradient id="crownGoldGradient" x1="6" y1="10" x2="42" y2="35" gradientUnits="userSpaceOnUse">
                        <stop stop-color="#FDE047"/>
                        <stop offset="0.45" stop-color="#F59E0B"/>
                        <stop offset="1" stop-color="#D97706"/>
                    </linearGradient>
                    <linearGradient id="crownBaseGradient" x1="6" y1="33" x2="42" y2="38" gradientUnits="userSpaceOnUse">
                        <stop stop-color="#D97706"/>
                        <stop offset="0.5" stop-color="#FBBF24"/>
                        <stop offset="1" stop-color="#B45309"/>
                    </linearGradient>
                </defs>
            </svg>
        </div>

        <!-- Brand Titles -->
        <h1 class="title-gradient">منصة تاج التعليمية</h1>
        <p class="subtitle">البوابة السحابية الموحدة لمنظومة التعليم التفاعلي المباشر</p>

        <!-- Live Server Status Beacon -->
        <div style="text-align: center;">
            <div class="status-badge">
                <span class="pulse-dot-wrapper">
                    <span class="pulse-dot-ping"></span>
                    <span class="pulse-dot-core"></span>
                </span>
                <span class="status-text">الخادم السحابي متصل • API v1 جاهز</span>
            </div>
        </div>

        <!-- Core Navigation CTAs -->
        <div>
            <!-- Primary CTA: Go to Frontend App -->
            <a href="{{ env('FRONTEND_URL', 'https://www.taj-edu.online') }}" target="_blank" rel="noopener noreferrer" class="btn-primary">
                <span>الذهاب للمنصة التعليمية</span>
                <!-- Rocket SVG (Inline) -->
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
                    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
                    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
                    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
                </svg>
            </a>

            <!-- Secondary CTA: Admin Portal -->
            <a href="/admin" target="_blank" rel="noopener noreferrer" class="btn-secondary">
                <!-- Shield Check SVG (Inline) -->
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    <path d="m9 12 2 2 4-4"/>
                </svg>
                <span>دخول لوحة الإدارة والحوكمة</span>
            </a>
        </div>

        <!-- Platform Architectural Pillars -->
        <div class="pillars-grid">
            <!-- Pillar 1: Classroom -->
            <div class="pillar-card">
                <div class="pillar-icon-box" style="background: rgba(99, 102, 241, 0.1); color: #4f46e5;">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="23 7 16 12 23 17 23 7"/>
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                    </svg>
                </div>
                <span class="pillar-title">فصول ذكية</span>
                <span class="pillar-desc">Agora WebRTC</span>
            </div>

            <!-- Pillar 2: Whiteboard -->
            <div class="pillar-card">
                <div class="pillar-icon-box" style="background: rgba(168, 85, 247, 0.1); color: #9333ea;">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="m18 5-3-3L6 11l3 3L18 5z"/>
                        <path d="m14 2 4 4"/>
                        <path d="M3 22l3-1 9-9-3-3-9 9-1 3z"/>
                    </svg>
                </div>
                <span class="pillar-title">سبورة تفاعلية</span>
                <span class="pillar-desc">Netless Sync</span>
            </div>

            <!-- Pillar 3: Escrow Wallet -->
            <div class="pillar-card">
                <div class="pillar-icon-box" style="background: rgba(16, 185, 129, 0.1); color: #059669;">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                        <rect width="20" height="14" x="2" y="5" rx="2"/>
                        <line x1="2" x2="22" y1="10" y2="10"/>
                    </svg>
                </div>
                <span class="pillar-title">محفظة الضمان</span>
                <span class="pillar-desc">Moyasar Escrow</span>
            </div>
        </div>

        <!-- Footer Meta Badges -->
        <div class="footer-bar">
            <!-- Version Badge -->
            <div class="badge-version">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" x2="12" y1="8" y2="12"/>
                    <line x1="12" x2="12.01" y1="16" y2="16"/>
                </svg>
                <span>الإصدار v2.1.0</span>
            </div>

            <!-- SSL / Encryption Badge -->
            <div class="badge-secure">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <span>بنية سحابية مشفرة</span>
            </div>
        </div>

    </main>

</body>
</html>