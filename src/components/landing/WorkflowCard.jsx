import React from 'react';
import { Play, Check, ArrowRight, Video, Share2, Users } from 'lucide-react';

export function WorkflowCard({
  step,
  stepBadge,
  name,
  subtitle,
  title,
  description,
  progressPercent = '50%',
  videoThumbnail,
  onPlay,
}) {
  const getStepIcon = (s) => {
    if (s === '01') return Video;
    if (s === '02') return Share2;
    return Users;
  };
  const StepIcon = getStepIcon(step);

  return (
    <div className="group rounded-xl bg-[#090b10] border border-white/[0.07] hover:border-white/20 transition-all duration-200 p-5 flex flex-col justify-between">
      <div className="space-y-4">
        {/* Video Thumbnail */}
        <div className="relative w-full aspect-[16/10] rounded-lg overflow-hidden bg-[#07080c] border border-white/5 group/thumb">
          {videoThumbnail ? (
            <img
              src={videoThumbnail}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover/thumb:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-zinc-900" />
          )}

          {/* Vignette Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

          {/* Step Pill */}
          <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-black/80 backdrop-blur-sm text-zinc-300 text-[10px] font-mono border border-white/10">
            {stepBadge || `Step ${step}`}
          </div>

          {/* Play Trigger */}
          <div className="absolute inset-0 flex items-center justify-center">
            <button
              type="button"
              onClick={onPlay}
              className="w-9 h-9 rounded-lg bg-[#e50914] hover:bg-[#c90812] flex items-center justify-center text-white transition-transform hover:scale-105 cursor-pointer shadow-md"
              title={`Play step ${step} preview`}
            >
              <Play className="w-4 h-4 ml-0.5 fill-white" />
            </button>
          </div>

          {/* Progress bar */}
          <div className="absolute bottom-2 left-3 right-3 h-0.5 bg-white/20 rounded-sm overflow-hidden">
            <div
              className="h-full bg-[#e50914] rounded-sm"
              style={{ width: progressPercent }}
            />
          </div>
        </div>

        {/* Step Header */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-300 shrink-0">
            <StepIcon className="w-4 h-4 text-[#e50914]" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-white truncate">
              {name}
            </h4>
            <p className="text-[11px] text-zinc-400 font-mono truncate">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Step Title & Description */}
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-white tracking-tight">
            {title}
          </h3>
          <p className="text-xs text-zinc-400 font-normal leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono">
        <span className="text-emerald-400 text-[11px] flex items-center gap-1.5 font-medium">
          <Check className="w-3.5 h-3.5" />
          <span>Configured</span>
        </span>
        <button
          type="button"
          onClick={onPlay}
          className="text-xs font-sans text-zinc-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
        >
          <span>Run Demo</span>
          <ArrowRight className="w-3 h-3 text-[#e50914]" />
        </button>
      </div>
    </div>
  );
}

export default WorkflowCard;
