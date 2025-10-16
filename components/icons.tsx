/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import {
  AlertTriangle,
  Archive,
  ArrowDown,
  ArrowRight,
  Baseline,
  BrainCircuit,
  ChevronDown,
  Clock,
  Film,
  Image,
  KeyRound,
  Layers,
  Mic,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
  Tv,
  UserMinus,
  X,
} from 'lucide-react';

const defaultProps = {
  strokeWidth: 1.5,
};

export const KeyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <KeyRound {...defaultProps} {...props} />
);

export const ArrowPathIcon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props,
) => <RefreshCw {...defaultProps} {...props} />;

export const SparklesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Sparkles {...defaultProps} {...props} />
);

export const PlusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Plus {...defaultProps} {...props} />
);

export const ChevronDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props,
) => <ChevronDown {...defaultProps} {...props} />;

export const SlidersHorizontalIcon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props,
) => <SlidersHorizontal {...defaultProps} {...props} />;

export const ArrowRightIcon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props,
) => <ArrowRight {...defaultProps} {...props} />;

export const RectangleStackIcon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props,
) => <Layers {...defaultProps} {...props} />;

export const XMarkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <X {...defaultProps} {...props} />
);

export const TextModeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Baseline {...defaultProps} {...props} />
);

export const FramesModeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props,
) => <Image {...defaultProps} {...props} />;

export const ReferencesModeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props,
) => <Film {...defaultProps} {...props} />;

export const TvIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Tv {...defaultProps} {...props} />
);

export const FilmIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Film {...defaultProps} {...props} />
);

// This icon had a different stroke width in the original file, so we preserve it.
export const CurvedArrowDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props,
) => <ArrowDown {...props} strokeWidth={3} />;

export const AlertTriangleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props,
) => <AlertTriangle {...defaultProps} {...props} />;

export const ClockIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Clock {...defaultProps} {...props} />
);

export const MicIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Mic {...defaultProps} {...props} />
);
export const BrainCircuitIcon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props,
) => <BrainCircuit {...defaultProps} {...props} />;
export const UserMinusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props,
) => <UserMinus {...defaultProps} {...props} />;
export const ArchiveIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Archive {...defaultProps} {...props} />
);
