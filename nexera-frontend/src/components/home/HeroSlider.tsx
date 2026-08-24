"use client";

import React, { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import Autoplay from 'embla-carousel-autoplay'
import Image from 'next/image'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const SLIDES = [
  {
    id: 1,
    image: "/banner-1.jpg", // We'll need placeholder images or actual ones
    title: "Điện Mặt Trời Công Nghiệp",
    description: "Giải pháp tối ưu hóa chi phí và phát triển bền vững cho doanh nghiệp."
  },
  {
    id: 2,
    image: "/banner-2.jpg",
    title: "Năng Lượng Xanh Cho Gia Đình",
    description: "Tiết kiệm đến 90% hóa đơn tiền điện với hệ thống điện mặt trời mái nhà."
  },
  {
    id: 3,
    image: "/banner-3.jpg",
    title: "Chính Sách Trả Góp 80%",
    description: "Hỗ trợ tài chính tối đa, thủ tục nhanh gọn, thu hồi vốn nhanh chóng."
  }
]

export function HeroSlider() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 5000 })])
  const [selectedIndex, setSelectedIndex] = useState(0)

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi, setSelectedIndex])

  useEffect(() => {
    if (!emblaApi) return
    onSelect()
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
  }, [emblaApi, onSelect])

  return (
    <div className="relative w-full h-[400px] md:h-[600px] xl:h-[700px]">
      <div className="overflow-hidden h-full" ref={emblaRef}>
        <div className="flex h-full">
          {SLIDES.map((slide) => (
            <div className="flex-[0_0_100%] min-w-0 relative h-full" key={slide.id}>
              <Image src="/doi.png" alt={slide.title} fill className="object-cover" />
              <div className="absolute inset-0 bg-[#13426E]/60 flex flex-col justify-center items-center text-center px-4">
                 <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">{slide.title}</h2>
                 <p className="text-lg md:text-2xl text-white/90 max-w-3xl">{slide.description}</p>
                 <button className="mt-8 px-8 py-3 bg-[#80BF49] text-white font-bold rounded-full hover:bg-white hover:text-[#13426E] transition-colors">
                   NHẬN TƯ VẤN NGAY
                 </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm transition-all z-10"
        onClick={scrollPrev}
      >
        <ChevronLeft className="w-8 h-8" />
      </button>

      <button
        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm transition-all z-10"
        onClick={scrollNext}
      >
        <ChevronRight className="w-8 h-8" />
      </button>

      <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-3 z-10">
        {SLIDES.map((_, index) => (
          <button
            key={index}
            className={`w-3 h-3 rounded-full transition-all ${
              index === selectedIndex ? 'bg-white scale-125' : 'bg-white/50'
            }`}
            onClick={() => emblaApi?.scrollTo(index)}
          />
        ))}
      </div>
    </div>
  )
}
