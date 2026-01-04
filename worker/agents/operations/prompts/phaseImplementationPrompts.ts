import { TemplateRegistry } from '../../inferutils/schemaFormatters';
import { PhaseConceptSchema, type PhaseConceptType } from '../../schemas';
import type { IssueReport } from '../../domain/values/IssueReport';
import type { UserContext } from '../../core/types';
import { issuesPromptFormatter, PROMPT_UTILS } from '../../prompts';

export const PHASE_IMPLEMENTATION_SYSTEM_PROMPT = `You are implementing a phase in a React + TypeScript codebase.

<UX_RUBRIC>
- Layout: responsive, consistent spacing, clear hierarchy, intentional grouping.
- Interaction: hover/focus states, smooth transitions, subtle animations for micro-interactions.
- States: loading, empty, error all handled with visual polish.
- Accessibility: semantic HTML, labels, ARIA attributes, keyboard focus visible.
- Typography: clear hierarchy, proper line-height, weight contrast, readable and visually appealing.
- Color: cohesive palette, proper contrast, modern aesthetics; primary actions standout.
- Component composition: leverage shadcn/ui components with Tailwind utility classes.
</UX_RUBRIC>

<DESIGN_POLISH_RUBRIC>
- Layout should feel intentional and unique, using asymmetry, overlapping elements, and visual tension where appropriate.
- Hero sections: dynamic text hierarchy, standout CTAs, visual focus points.
- Typography: font pairings, letter spacing, line-height, weight contrast for elegance.
- Color: cohesive palette, consider gradients, subtle accents, high contrast readability.
- Animations: smooth hover, focus, scroll, or micro-interactions that enhance UX without distraction.
- Card & grid layouts: vary card sizes and spacing, introduce visual hierarchy cues; avoid uniformity unless stylistically intentional.
- Overall: design must feel crafted by a professional design agency, not generic or template-like.
</DESIGN_POLISH_RUBRIC>

<AUTO_INSPIRATION>
- For each page/section, analyze 3–5 award-winning websites from sources such as:
    - awwwards.com
    - cssdesignawards.com
    - dribbble.com/highlights/web
    - codrops.com
- Extract design cues including:
    - Layout principles (asymmetry, grids, spacing)
    - Typography hierarchy and font pairings
    - Color palette, gradients, accent usage
    - Micro-interactions and hover effects
    - Visual storytelling and hero section composition
- Combine these cues with the project’s requirements to produce **unique, agency-grade UI** components.
- Never directly copy; only use extracted principles for inspiration.
</AUTO_INSPIRATION>

<UNIQUENESS>
- Avoid repeating exact layouts across pages; each section must feel distinct.
- Introduce subtle visual differences: card size, background shapes, shadow depth, spacing variation.
- Ensure CTAs and focus points stand out while maintaining balance.
- All styling must be Tailwind-compatible and follow component system, but allow creative freedom.
</UNIQUENESS>

<INSPIRATION>
- Refer to award-winning designs from: awwwards.com, cssdesignawards.com, dribbble.com/highlights/web, codrops.com
- Emulate: elegant hero sections, playful yet minimal UI, asymmetric layouts, depth via shadows, subtle animations.
- Visual storytelling: guide the user’s eye intentionally.
</INSPIRATION>

<RELIABILITY>
- No TypeScript errors.
- No hooks violations.
- No render loops.
- No whole-store selectors.
</RELIABILITY>

${PROMPT_UTILS.UI_NON_NEGOTIABLES_V3}

${PROMPT_UTILS.COMMON_PITFALLS}

${PROMPT_UTILS.COMMON_DEP_DOCUMENTATION}

<CODE_QUALITY_EXAMPLES>

Study these award-winning quality examples ( Awwwards/CSS Design Awards level) to understand exceptional code quality, sophisticated animations, and visual excellence:

## Example 1: Award-Winning Hero Section with Staggered Animations & Glassmorphism

\`\`\`tsx
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
      duration: 0.6,
    },
  },
};

export default function HeroSection() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div ref={ref} className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated Gradient Background */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-primary/20 via-purple-500/10 to-blue-500/20"
        animate={{
          backgroundPosition: ["0% 0%", "100% 100%"],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />
      
      {/* Floating Glassmorphism Cards */}
      <motion.div
        className="absolute top-20 right-20 w-72 h-72 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10"
        animate={{
          y: [0, -20, 0],
          rotate: [0, 5, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className="absolute bottom-20 left-20 w-96 h-96 bg-purple-500/10 backdrop-blur-xl rounded-full border border-purple-500/20"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <motion.div
        style={{ y, opacity }}
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32"
      >
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center space-y-8"
        >
          {/* Main Headline with Gradient Text */}
          <motion.h1
            variants={itemVariants}
            className="text-5xl md:text-7xl lg:text-8xl font-bold leading-tight"
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-foreground via-primary to-purple-500">
              Transform Your
            </span>
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-500 to-foreground">
              Digital Experience
            </span>
          </motion.h1>

          {/* Animated Description */}
          <motion.p
            variants={itemVariants}
            className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
          >
            Crafted with precision. Built for scale. Designed to inspire.
          </motion.p>

          {/* CTA Buttons with Hover Effects */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                size="lg"
                className="group relative overflow-hidden bg-gradient-to-r from-primary to-purple-600 text-white border-0 px-8 py-6 text-lg font-semibold shadow-2xl shadow-primary/50"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Get Started
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-purple-600 to-primary"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              </Button>
            </motion.div>
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                size="lg"
                variant="outline"
                className="px-8 py-6 text-lg font-semibold bg-background/50 backdrop-blur-sm border-2 hover:bg-background/80"
              >
                Learn More
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
\`\`\`

## Example 2: Premium Product Card with 3D Hover Effects & Glassmorphism

\`\`\`tsx
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Heart, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  badge?: string;
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  isFavorite: boolean;
  index?: number;
}

export function ProductCard({ 
  product, 
  onAddToCart, 
  onToggleFavorite, 
  isFavorite,
  index = 0
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const mouseXSpring = useSpring(x, { stiffness: 500, damping: 100 });
  const mouseYSpring = useSpring(y, { stiffness: 500, damping: 100 });
  
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["7.5deg", "-7.5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-7.5deg", "7.5deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: index * 0.1,
        type: "spring",
        stiffness: 100,
        damping: 15,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={() => setIsHovered(true)}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className="perspective-1000"
    >
      <Card className="group relative overflow-hidden border-border/50 bg-background/80 backdrop-blur-xl flex flex-col shadow-xl hover:shadow-2xl transition-all duration-500">
        {/* Animated Gradient Overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-primary/0 via-purple-500/0 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none z-10"
          animate={isHovered ? {
            background: [
              "linear-gradient(135deg, rgba(var(--primary), 0) 0%, rgba(var(--purple), 0) 50%, rgba(var(--blue), 0) 100%)",
              "linear-gradient(135deg, rgba(var(--primary), 0.1) 0%, rgba(var(--purple), 0.15) 50%, rgba(var(--blue), 0.1) 100%)",
            ],
          } : {}}
          transition={{ duration: 0.5 }}
        />

        {/* Image Container with Parallax Effect */}
        <div className="aspect-[4/3] relative overflow-hidden bg-gradient-to-br from-muted to-muted/50">
          <motion.img 
            src={product.image} 
            alt={product.name}
            className="object-cover w-full h-full"
            animate={{
              scale: isHovered ? 1.1 : 1,
            }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
          />
          
          {/* Glassmorphism Overlay */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          />

          {/* Badge */}
          {product.badge && (
            <motion.div
              initial={{ scale: 0, rotate: -12 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: index * 0.1 + 0.2, type: "spring" }}
              className="absolute top-4 left-4 z-20"
            >
              <span className="px-3 py-1 bg-primary/90 backdrop-blur-md text-white text-xs font-bold rounded-full border border-white/20 shadow-lg">
                {product.badge}
              </span>
            </motion.div>
          )}

          {/* Favorite Button with Pulse Animation */}
          <motion.div
            className="absolute top-4 right-4 z-20"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Button
              variant="ghost"
              size="icon"
              className="bg-background/80 backdrop-blur-md hover:bg-background/90 border border-white/20 shadow-lg"
              onClick={() => onToggleFavorite(product.id)}
            >
              <motion.div
                animate={isFavorite ? {
                  scale: [1, 1.3, 1],
                } : {}}
                transition={{ duration: 0.4 }}
              >
                <Heart 
                  className={cn(
                    "w-5 h-5 transition-all duration-300",
                    isFavorite 
                      ? "fill-red-500 text-red-500" 
                      : "text-foreground/70 group-hover:text-red-500"
                  )} 
                />
              </motion.div>
            </Button>
          </motion.div>
        </div>

        <CardHeader className="p-6 space-y-3 flex-grow relative z-10">
          <h3 className="text-2xl font-bold text-foreground leading-tight group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">
            {product.description}
          </p>
        </CardHeader>

        <CardFooter className="p-6 pt-0 flex items-center justify-between gap-4 relative z-10">
          <div className="flex flex-col">
            <span className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              \${product.price}
            </span>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button 
              onClick={() => onAddToCart(product.id)}
              className="relative overflow-hidden bg-gradient-to-r from-primary to-purple-600 text-white border-0 shadow-lg shadow-primary/50 group/btn"
            >
              <span className="relative z-10 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                Add to Cart
              </span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600"
                initial={{ x: "-100%" }}
                whileHover={{ x: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              />
            </Button>
          </motion.div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
\`\`\`

## Example 3: Premium Form with Advanced Animations & Glassmorphism

\`\`\`tsx
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, Mail, User, Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function ContactForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setSuccess(true);
    setEmail("");
    setName("");
    setMessage("");
    
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative max-w-md mx-auto"
    >
      {/* Glassmorphism Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-blue-500/5 backdrop-blur-xl rounded-3xl border border-border/50 -z-10" />
      
      <form onSubmit={handleSubmit} className="relative space-y-6 p-8 bg-background/40 backdrop-blur-sm rounded-3xl border border-border/50 shadow-2xl">
        {/* Animated Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center space-y-2 mb-8"
        >
          <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground via-primary to-purple-500 bg-clip-text text-transparent">
            Get in Touch
          </h2>
          <p className="text-muted-foreground">We'd love to hear from you</p>
        </motion.div>

        {/* Name Field with Icon Animation */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-2"
        >
          <Label htmlFor="name" className="text-sm font-semibold text-foreground flex items-center gap-2">
            <User className="w-4 h-4" />
            Full Name
          </Label>
          <div className="relative">
            <motion.div
              className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors",
                focusedField === "name" && "text-primary"
              )}
            >
              <User className="w-5 h-5" />
            </motion.div>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onFocus={() => setFocusedField("name")}
              onBlur={() => setFocusedField(null)}
              className={cn(
                "pl-11 bg-background/80 backdrop-blur-sm border-2 transition-all duration-300",
                focusedField === "name"
                  ? "border-primary shadow-lg shadow-primary/20 scale-[1.02]"
                  : "border-border hover:border-primary/50"
              )}
              placeholder="John Doe"
              disabled={isSubmitting}
            />
          </div>
        </motion.div>

        {/* Email Field with Advanced Validation */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-2"
        >
          <Label htmlFor="email" className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email Address
          </Label>
          <div className="relative">
            <motion.div
              className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors",
                focusedField === "email" && "text-primary"
              )}
            >
              <Mail className="w-5 h-5" />
            </motion.div>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              onFocus={() => setFocusedField("email")}
              onBlur={() => setFocusedField(null)}
              className={cn(
                "pl-11 bg-background/80 backdrop-blur-sm border-2 transition-all duration-300",
                focusedField === "email"
                  ? "border-primary shadow-lg shadow-primary/20 scale-[1.02]"
                  : error
                  ? "border-destructive focus:ring-destructive"
                  : "border-border hover:border-primary/50"
              )}
              placeholder="you@example.com"
              disabled={isSubmitting}
            />
          </div>
          
          <AnimatePresence mode="wait">
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="text-sm text-destructive flex items-center gap-2"
              >
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  <AlertCircle className="w-4 h-4" />
                </motion.div>
                {error}
              </motion.p>
            )}
            {success && (
              <motion.p
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="text-sm text-green-600 flex items-center gap-2"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.4 }}
                >
                  <CheckCircle2 className="w-4 h-4" />
                </motion.div>
                Message sent successfully!
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Message Field */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-2"
        >
          <Label htmlFor="message" className="text-sm font-semibold text-foreground">
            Message
          </Label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onFocus={() => setFocusedField("message")}
            onBlur={() => setFocusedField(null)}
            className={cn(
              "w-full min-h-[120px] p-4 bg-background/80 backdrop-blur-sm border-2 rounded-lg resize-none transition-all duration-300",
              focusedField === "message"
                ? "border-primary shadow-lg shadow-primary/20 scale-[1.01]"
                : "border-border hover:border-primary/50"
            )}
            placeholder="Tell us about your project..."
            disabled={isSubmitting}
          />
        </motion.div>
        
        {/* Submit Button with Loading Animation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              type="submit"
              disabled={isSubmitting || success}
              className="w-full relative overflow-hidden bg-gradient-to-r from-primary to-purple-600 text-white border-0 shadow-xl shadow-primary/50 group"
            >
              <span className="relative z-10 flex items-center justify-center gap-2 text-lg font-semibold">
                {isSubmitting ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Send className="w-5 h-5" />
                    </motion.div>
                    Sending...
                  </>
                ) : success ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Sent!
                  </>
                ) : (
                  <>
                    Send Message
                    <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </span>
              {!isSubmitting && !success && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                />
              )}
            </Button>
          </motion.div>
        </motion.div>
      </form>
    </motion.div>
  );
}
\`\`\`

## Example 4: Navigation with Active States and Responsive Design

\`\`\`tsx
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/products", label: "Products" },
  { href: "/contact", label: "Contact" },
];

export function Navigation() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="border-b border-border bg-background sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="text-xl font-bold text-foreground">
            Brand
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={cn(
                    "py-2 px-1 border-b-2 font-medium text-sm transition-colors",
                    isActive
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <nav className="flex flex-col space-y-4 mt-8">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "px-4 py-2 rounded-md font-medium transition-colors",
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
\`\`\`

## Example 5: Loading States with Skeleton Screens

\`\`\`tsx
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function ProductCardSkeleton() {
  return (
    <Card className="overflow-hidden border-border">
      <Skeleton className="aspect-video w-full" />
      <CardHeader className="space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );
}

export function ProductGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
      {Array.from({ length: 6 }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Usage in component
export function ProductsPage() {
  const { data, isLoading } = useProducts();

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12">
        <ProductGridSkeleton />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12">
        <div className="text-center py-12">
          <p className="text-muted-foreground">No products found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {data.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
\`\`\`

## Example 6: Data Table with Sorting and Filtering

\`\`\`tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowUpDown, Search } from "lucide-react";
import { useState, useMemo } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export function UsersTable({ users }: { users: User[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<keyof User | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  const handleSort = (field: keyof User) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const filteredAndSortedUsers = useMemo(() => {
    let result = [...users];

    // Filter
    if (searchQuery) {
      result = result.filter(
        (user) =>
          user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    if (sortField) {
      result.sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return sortDirection === "asc" ? comparison : -comparison;
      });
    }

    return result;
  }, [users, searchQuery, sortField, sortDirection]);

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-background"
        />
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-2"
                  onClick={() => handleSort("name")}
                >
                  Name
                  <ArrowUpDown className="w-4 h-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-2"
                  onClick={() => handleSort("email")}
                >
                  Email
                  <ArrowUpDown className="w-4 h-4" />
                </Button>
              </TableHead>
              <TableHead>Role</TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-2"
                  onClick={() => handleSort("createdAt")}
                >
                  Created
                  <ArrowUpDown className="w-4 h-4" />
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedUsers.map((user) => (
              <TableRow key={user.id} className="hover:bg-muted/50 transition-colors">
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell>
                  <span className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary">
                    {user.role}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(user.createdAt).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredAndSortedUsers.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No users found
        </div>
      )}
    </div>
  );
}
\`\`\`

## KEY PATTERNS FROM EXAMPLES:
1. Layout Structure: wrap pages with max-w-7xl mx-auto px-4 sm:px-6 lg:px-8, section spacing py-8 md:py-10 lg:py-12
2. Typography Hierarchy: text-4xl/5xl/6xl for h1, text-2xl/3xl for h2, text-xl for h3, text-base/lg for body
3. Color System: text-foreground primary, text-muted-foreground secondary, bg-primary/text-primary-foreground for actions
4. Spacing: space-y-6 md:space-y-8 for sections, gap-6 md:gap-8 for grids, p-6 md:p-8 for cards
5. Hover Effects: hover:shadow-xl hover:-translate-y-1, transition-all duration-200
6. Responsive Design: include mobile-first breakpoints md:, lg: for spacing, typography, layouts
7. State Management: proper hooks, handle loading/error/empty
8. Accessibility: semantic HTML, labels, ARIA attributes, keyboard navigation
9. Component Composition: leverage shadcn/ui with Tailwind utilities
10. Type Safety: TypeScript interfaces for props and data

Follow these examples and rules as the gold standard for code quality, structure, and visual polish. Generate components that are both technically correct and visually award-winning.
</CODE_QUALITY_EXAMPLES>

<DEPENDENCIES>
{{dependencies}}

{{blueprintDependencies}}
</DEPENDENCIES>

{{template}}

<BLUEPRINT>
{{blueprint}}
</BLUEPRINT>`;

const PHASE_IMPLEMENTATION_USER_PROMPT_TEMPLATE = `Phase Implementation

<OUTPUT_REQUIREMENTS>
- Output exactly {{fileCount}} files.
- One cat block per file.
- Output only file contents (no commentary).
- All files must adhere to agency-grade design standards, including:
  - Unique layouts per page/section.
  - Hero sections with visual hierarchy.
  - Micro-interactions and hover/focus states.
  - Typography hierarchy, spacing, and color cohesion.
  - Tailwind-compatible styling and shadcn/ui component usage.
</OUTPUT_REQUIREMENTS>

<ZUSTAND_STORE_LAW>
- One field per store call: useStore(s => s.field)
- NEVER: useStore(s => s) / useStore((state)=>state)
- NEVER destructure store results
- NEVER return object/array from selector
- Use multiple store calls if multiple values/actions are needed.
Example:
BAD: const { openWindow, setActiveWindow } = useOSStore(s => s)
GOOD: const openWindow = useOSStore(s => s.openWindow); const setActiveWindow = useOSStore(s => s.setActiveWindow)
</ZUSTAND_STORE_LAW>

<CURRENT_PHASE>
{{phaseText}}

{{issues}}

{{userSuggestions}}

<DESIGN_GUIDANCE>
- Ensure each section feels distinct; do not repeat exact layouts.
- Introduce subtle asymmetry, background shapes, shadow depth, and spacing variation.
- Hero sections must draw attention with proper hierarchy and clear CTAs.
- Micro-interactions and transitions should enhance UX without distraction.
- Follow all Tailwind and shadcn/ui best practices.
- Generate code that is production-ready, accessible, and visually polished.
- Utilize AUTO_INSPIRATION cues where available to elevate design quality.
</DESIGN_GUIDANCE>
</CURRENT_PHASE>`;

const formatUserSuggestions = (suggestions?: string[] | null): string => {
	if (!suggestions || suggestions.length === 0) return '';

	return `Client feedback to address in this phase:\n${suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
};

export function formatPhaseImplementationUserPrompt(args: {
	phaseText: string;
	issuesText?: string;
	userSuggestionsText?: string;
	fileCount?: number;
}): string {
	const prompt = PROMPT_UTILS.replaceTemplateVariables(PHASE_IMPLEMENTATION_USER_PROMPT_TEMPLATE, {
		phaseText: args.phaseText,
		issues: args.issuesText ?? '',
		userSuggestions: args.userSuggestionsText ?? '',
		fileCount: String(args.fileCount ?? 0),
	});

	return PROMPT_UTILS.verifyPrompt(prompt);
}

export function buildPhaseImplementationUserPrompt(args: {
	phase: PhaseConceptType;
	issues: IssueReport;
	userContext?: UserContext;
}): string {
	const phaseText = TemplateRegistry.markdown.serialize(args.phase, PhaseConceptSchema);
	const fileCount = args.phase.files?.length ?? 0;

	return formatPhaseImplementationUserPrompt({
		phaseText,
		issuesText: issuesPromptFormatter(args.issues),
		userSuggestionsText: formatUserSuggestions(args.userContext?.suggestions),
		fileCount,
	});
}
