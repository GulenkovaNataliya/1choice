import Image from "next/image";

export default function KeyIcon({ className }: { className?: string }) {
  return (
    <Image
      src="/logo/logo-chat.png"
      alt=""
      aria-hidden="true"
      width={18}
      height={18}
      className={className}
    />
  );
}
