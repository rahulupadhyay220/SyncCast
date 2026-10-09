import React from 'react';
import { ArrowRight, Clock } from 'lucide-react';

export function FeatureCard({
  image,
  imageAlt,
  category,
  categoryIcon: CategoryIcon,
  title,
  description,
  metaIcon: MetaIcon = Clock,
  metaText,
  actionText = 'Explore',
  onAction,
}) {
  return (
    <div className="group rounded-xl bg-[#090b10] border border-white/[0.07] hover:border-white/20 transition-all duration-200 p-5 flex flex-col justify-between">
      <div className="space-y-4">
        {/* Visual Container */}
        {image && (
          <div className="relative w-full aspect-[16/10] rounded-lg overflow-hidden bg-[#07080c] border border-white/5">
            <img
              src={image}
              alt={imageAlt || title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            {category && (
              <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/80 backdrop-blur-sm text-zinc-200 text-[10px] font-mono border border-white/10">
                {CategoryIcon && <CategoryIcon className="w-3 h-3 text-[#e50914]" />}
                <span>{category}</span>
              </div>
            )}
          </div>
        )}

        <div className="space-y-1.5">
          <h3 className="text-sm font-bold text-white tracking-tight">
            {title}
          </h3>
          <p className="text-xs text-zinc-400 font-normal leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      <div className="pt-4 mt-4 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono">
        <span className="text-[11px] text-zinc-500">
          {metaText || 'Sub-25ms Sync'}
        </span>

        <button
          type="button"
          onClick={onAction}
          className="text-xs font-sans font-medium text-zinc-300 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
        >
          <span>{actionText}</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#e50914]" />
        </button>
      </div>
    </div>
  );
}

export default FeatureCard;
