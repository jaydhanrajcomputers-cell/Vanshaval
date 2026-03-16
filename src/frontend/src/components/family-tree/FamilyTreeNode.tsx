import { Plus, UserRound, X } from "lucide-react";
import { motion } from "motion/react";
import type { FamilyMember } from "../../backend.d";

export type NodeRole =
  | "center"
  | "father"
  | "mother"
  | "spouse"
  | "fatherInLaw"
  | "motherInLaw"
  | "brother"
  | "sister"
  | "child";

// Color scheme per specification
const ROLE_STYLES: Record<
  NodeRole,
  {
    border: string;
    bg: string;
    text: string;
    label: string;
    dashedBorder: string;
    plusColor: string;
  }
> = {
  center: {
    border: "border-red-600",
    bg: "bg-red-50",
    text: "text-red-900",
    label: "केंद्र",
    dashedBorder: "border-red-400",
    plusColor: "text-red-400",
  },
  father: {
    border: "border-gray-800",
    bg: "bg-gray-50",
    text: "text-gray-900",
    label: "वडील",
    dashedBorder: "border-gray-500",
    plusColor: "text-gray-500",
  },
  mother: {
    border: "border-amber-500",
    bg: "bg-amber-50",
    text: "text-amber-900",
    label: "आई",
    dashedBorder: "border-amber-400",
    plusColor: "text-amber-400",
  },
  spouse: {
    border: "border-orange-500",
    bg: "bg-orange-50",
    text: "text-orange-900",
    label: "पती/पत्नी",
    dashedBorder: "border-orange-400",
    plusColor: "text-orange-400",
  },
  fatherInLaw: {
    border: "border-sky-500",
    bg: "bg-sky-50",
    text: "text-sky-900",
    label: "सासरे",
    dashedBorder: "border-sky-400",
    plusColor: "text-sky-400",
  },
  motherInLaw: {
    border: "border-green-500",
    bg: "bg-green-50",
    text: "text-green-900",
    label: "सासू",
    dashedBorder: "border-green-400",
    plusColor: "text-green-400",
  },
  brother: {
    border: "border-blue-600",
    bg: "bg-blue-50",
    text: "text-blue-900",
    label: "भाऊ",
    dashedBorder: "border-blue-400",
    plusColor: "text-blue-400",
  },
  sister: {
    border: "border-emerald-600",
    bg: "bg-emerald-50",
    text: "text-emerald-900",
    label: "बहीण",
    dashedBorder: "border-emerald-400",
    plusColor: "text-emerald-400",
  },
  child: {
    border: "border-pink-500",
    bg: "bg-pink-50",
    text: "text-pink-900",
    label: "मुले",
    dashedBorder: "border-pink-400",
    plusColor: "text-pink-400",
  },
};

export interface FamilyTreeNodeProps {
  member: FamilyMember | null;
  nodeRole: NodeRole;
  isAdmin?: boolean;
  isUserLoggedIn?: boolean;
  onSingleClick?: (member: FamilyMember) => void;
  onDoubleClick?: (member: FamilyMember) => void;
  onEmptyClick?: () => void;
  onRemove?: () => void;
  animationDelay?: number;
  roleLabel?: string;
  ocid?: string;
}

export function FamilyTreeNode({
  member,
  nodeRole,
  isAdmin = false,
  isUserLoggedIn = false,
  onSingleClick,
  onDoubleClick,
  onEmptyClick,
  onRemove,
  animationDelay = 0,
  roleLabel,
  ocid,
}: FamilyTreeNodeProps) {
  const styles = ROLE_STYLES[nodeRole];
  const label = roleLabel ?? styles.label;
  const isCenter = nodeRole === "center";

  // Double-click handling using ref to track last click time
  const lastClickTime = { current: 0 };

  const handleClick = (m: FamilyMember) => {
    const now = Date.now();
    const timeSinceLastClick = now - lastClickTime.current;
    lastClickTime.current = now;

    if (timeSinceLastClick < 300) {
      // Double-click
      onDoubleClick?.(m);
    } else {
      // Single click — delay to allow double-click detection
      setTimeout(() => {
        if (Date.now() - lastClickTime.current >= 280) {
          onSingleClick?.(m);
        }
      }, 300);
    }
  };

  if (!member) {
    // Placeholder node — only visible to admin
    if (!isAdmin) return null;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: animationDelay, duration: 0.35 }}
        className="flex flex-col items-center gap-1.5"
      >
        <button
          type="button"
          onClick={onEmptyClick}
          className={`
            relative rounded-full border-2 border-dashed flex items-center justify-center
            transition-all duration-200 select-none
            ${styles.dashedBorder} bg-white/60
            ${isCenter ? "w-24 h-24" : "w-20 h-20"}
            cursor-pointer hover:scale-105 hover:bg-white/90 active:scale-95
          `}
          title={`${label} जोडा`}
          data-ocid={ocid}
        >
          <Plus className={`h-6 w-6 ${styles.plusColor}`} />
        </button>
        <span className="font-ui text-[10px] text-muted-foreground uppercase tracking-wide text-center leading-tight max-w-[5rem]">
          {label}
        </span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        delay: animationDelay,
        duration: 0.4,
        type: "spring",
        stiffness: 200,
      }}
      className="flex flex-col items-center gap-1.5 relative"
      data-ocid={ocid}
    >
      <div className="relative">
        <button
          type="button"
          onClick={() => handleClick(member)}
          className={`
            relative group rounded-full border-[3px] flex flex-col items-center justify-center
            transition-all duration-200 select-none shadow-card overflow-hidden
            ${styles.border} ${styles.bg}
            ${isCenter ? "w-24 h-24" : "w-20 h-20"}
            ${onSingleClick || onDoubleClick ? "cursor-pointer hover:scale-110 hover:shadow-heritage active:scale-95" : "cursor-default"}
          `}
          title={`${member.name}${!isCenter && isUserLoggedIn ? " (एकदा क्लिक = माहिती, दोनदा क्लिक = केंद्र)" : ""}`}
        >
          {/* Photo or icon */}
          {member.photoData ? (
            <img
              src={member.photoData}
              alt={member.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <UserRound
              className={`${isCenter ? "h-10 w-10" : "h-7 w-7"} ${styles.text}`}
            />
          )}

          {/* Deceased overlay */}
          {member.isDeceased && (
            <div className="absolute inset-0 rounded-full bg-gray-900/20 flex items-end justify-center pb-1">
              <span className="text-[8px] font-ui text-gray-700 bg-white/80 px-1 rounded-full">
                †
              </span>
            </div>
          )}

          {/* Center indicator dot */}
          {isCenter && (
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 border-2 border-white" />
          )}
        </button>

        {/* Admin remove button */}
        {isAdmin && !isCenter && onRemove && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 border-2 border-white flex items-center justify-center hover:bg-red-700 transition-colors z-10"
            title="हे नाते काढा"
            data-ocid={`family-tree.${nodeRole}.delete_button`}
          >
            <X className="h-2.5 w-2.5 text-white" />
          </button>
        )}
      </div>

      {/* Name */}
      <div className="text-center max-w-[5.5rem]">
        <p
          className={`font-body text-xs font-semibold ${styles.text} leading-tight line-clamp-2 ${isCenter ? "text-sm" : ""}`}
        >
          {member.name}
        </p>
        <p className="font-ui text-[9px] text-muted-foreground uppercase tracking-wide mt-0.5">
          {label}
        </p>
        {member.village && (
          <p className="font-ui text-[9px] text-muted-foreground/80 leading-tight mt-0.5 truncate">
            {member.village}
          </p>
        )}
      </div>
    </motion.div>
  );
}
