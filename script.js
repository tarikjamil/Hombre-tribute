// smooth scroll

const lenis = new Lenis({
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // https://www.desmos.com/calculator/brs54l4xou
  direction: "vertical", // vertical, horizontal
  gestureDirection: "vertical", // vertical, horizontal, both
  smooth: true,
  mouseMultiplier: 1,
  smoothTouch: false,
  touchMultiplier: 2,
  infinite: false
});

//get scroll value
lenis.on("scroll", ({ scroll, limit, velocity, direction, progress }) => {});

function raf(time) {
  lenis.raf(time);
  requestAnimationFrame(raf);
}

requestAnimationFrame(raf);

// play music
let sound = new Howl({
  src: ["https://8fsuwh.csb.app/hombre.mp3"],
  loop: true
});

$(".audio-player-wrapper").on("click", function () {
  $(this).toggleClass("playing");
  if ($(this).hasClass("playing")) {
    sound.play();
  } else {
    sound.pause();
  }
});

// split type
let text;
// Split the text up
function runSplit() {
  text = new SplitType(".split-type", {
    types: "lines, words",
    lineClass: "split-line",
    wordClass: "is--scroll-intoview-scrub"
  });
}

let text2;
// Split the text up
function runSplit2() {
  text = new SplitType(".question-text", {
    types: "chars",
    lineClass: "quelques-text-line",
    charClass: "char-text"
  });
}

runSplit();
runSplit2();
// Update on window resize
let windowWidth = $(window).innerWidth();
window.addEventListener("resize", function () {
  if (windowWidth !== $(window).innerWidth()) {
    windowWidth = $(window).innerWidth();
    text.revert();
    text2.revert();
    runSplit();
    runSplit2();
  }
});

// split type ends

gsap.registerPlugin(ScrollTrigger);

// On Page Load
function pageLoad() {
  let tl = gsap.timeline();
  var an = new TimelineLite();

  tl.to(".main-wrapper", {
    opacity: 1,
    ease: "Quint.easeOut",
    duration: 0.5
  });

  tl.fromTo(
    ".loader-imgs",
    {
      scale: 1.2
    },
    {
      scale: 0.8,
      delay: -1,
      duration: 40
    }
  );

  tl.from(".loading-img", {
    y: "10rem",
    opacity: "0",
    stagger: { each: 0.1, from: "start" },
    ease: "Quint.easeOut",
    duration: 0.8,
    delay: -39.2
  });
  tl.from(".is--hero-text", {
    y: "5vw",
    opacity: "0",
    stagger: { each: 0.2, from: "start" },
    ease: "Quint.easeOut",
    delay: -38,
    duration: 0.5
  });

  tl.to(".loader-imgs-holder", {
    y: "-100%",
    stagger: { each: 0.2, from: "start" },
    ease: "Quint.easein",
    delay: -37,
    duration: 0.6
  });

  tl.to(".loader-imgs", {
    y: "100%",
    stagger: { each: 0.2, from: "start" },
    ease: "Quint.easein",
    delay: -37,
    duration: 0.6
  });

  tl.from(".is--navbar-loading-animation", {
    y: "10rem",
    opacity: 0,
    stagger: { each: 0.1, from: "start" },
    ease: "Quint.easeOut",
    delay: -36.5,
    duration: 1
  });

  tl.to(".body", {
    height: "auto",
    ease: "Quint.easeOut",
    delay: -36.8,
    duration: 1
  });
}
pageLoad();

// hero animation on scroll
gsap.to(".hero-img-bg", {
  scrollTrigger: {
    trigger: ".hero-img-bg-wrapper",
    start: "top top",
    end: "bottom top",
    scrub: true
  },
  scale: 1.2
});

gsap.to(".logo-parent", {
  scrollTrigger: {
    trigger: ".hero-img-bg-wrapper",
    start: "top top",
    end: "bottom top",
    scrub: true
  },
  height: "56rem",
  fontSize: "56rem"
});

// transtion
gsap.from(".transition-el", {
  scrollTrigger: {
    trigger: ".transition-div",
    start: "top bottom",
    end: "bottom top",
    scrub: true
  },
  height: "0%"
});

// question animation
gsap.to(".question-text", {
  scrollTrigger: {
    trigger: ".section.is--question",
    start: "top center",
    end: "bottom top",
    scrub: true
  },
  x: "-200vw"
});

gsap.from(".question-overlay", {
  scrollTrigger: {
    trigger: ".section.is--question",
    start: "top center",
    end: "bottom top",
    scrub: true
  },
  opacity: 0
});

gsap.from(".question-img", {
  scrollTrigger: {
    trigger: ".section.is--question",
    start: "top bottom",
    end: "bottom top",
    scrub: true
  },
  scale: 1.1,
  y: "15%"
});

$(".section.is--question").each(function (index) {
  let triggerElement = $(this);
  let targetElement = $(".char-text");

  let tl = gsap.timeline({
    scrollTrigger: {
      trigger: triggerElement,
      // trigger element - viewport
      start: "top center",
      end: "bottom bottom",
      scrub: true
    }
  });
  tl.from(targetElement, {
    y: "5vw",
    opacity: 0,
    stagger: {
      amount: 1,
      from: "0"
    }
  });
});

// transtion
gsap.from(".big-img", {
  scrollTrigger: {
    trigger: ".is--big-img-bg",
    start: "bottom bottom",
    end: "bottom top",
    scrub: true
  },
  y: "-5%"
});

// footer interaction
gsap.from(".heading--footer.is--footer-1", {
  scrollTrigger: {
    trigger: ".section.is--footer",
    start: "top center",
    end: "bottom bottom",
    scrub: true
  },
  x: "-100rem",
  opacity: 0
});

gsap.from(".heading--footer.is--footer-2", {
  scrollTrigger: {
    trigger: ".section.is--footer",
    start: "top center",
    end: "bottom bottom",
    scrub: true
  },
  x: "100rem",
  opacity: 0
});

gsap.to(".navbar, .logo-parent", {
  scrollTrigger: {
    trigger: ".section.is--footer",
    start: "top center",
    end: "bottom bottom",
    scrub: true
  },
  y: "-20rem",
  opacity: 0
});

gsap.from(".footer-text, .footer-logo-text, .footer-animation", {
  scrollTrigger: {
    trigger: ".section.is--footer",
    start: "top +=50",
    end: "bottom bottom",
    scrub: true
  },
  y: "20rem",
  opacity: 0
});

// parallax image
$(".parallax-img").each(function (index) {
  let triggerElement = $(this);
  let targetElement = $(this);

  let tl = gsap.timeline({
    scrollTrigger: {
      trigger: triggerElement,
      // trigger element - viewport
      start: "top bottom",
      end: "bottom top",
      scrub: true
    }
  });
  tl.from(targetElement, {
    y: "-15%"
  });
});

$(".parallax-img-reverse").each(function (index) {
  let triggerElement = $(this);
  let targetElement = $(this);

  let tl = gsap.timeline({
    scrollTrigger: {
      trigger: triggerElement,
      // trigger element - viewport
      start: "top bottom",
      end: "bottom top",
      scrub: true
    }
  });
  tl.from(targetElement, {
    y: "15%"
  });
});

// into view scrub image
$(".is--scroll-intoview-scrub").each(function (index) {
  let triggerElement = $(this);
  let targetElement = $(this);

  let tl = gsap.timeline({
    scrollTrigger: {
      trigger: triggerElement,
      // trigger element - viewport
      start: "top bottom",
      end: "top center",
      scrub: true
    }
  });
  tl.from(targetElement, {
    y: "100%"
  });
});

// PAGE COLOR POWER-UP
window.addEventListener("DOMContentLoaded", (event) => {
  // attribute value checker
  function attr(defaultVal, attrVal) {
    const defaultValType = typeof defaultVal;
    if (typeof attrVal !== "string" || attrVal.trim() === "") return defaultVal;
    if (attrVal === "true" && defaultValType === "boolean") return true;
    if (attrVal === "false" && defaultValType === "boolean") return false;
    if (isNaN(attrVal) && defaultValType === "string") return attrVal;
    if (!isNaN(attrVal) && defaultValType === "number") return +attrVal;
    return defaultVal;
  }
  // pagecolor trigger
  $("[tr-pagecolor-element='trigger']").each(function (index) {
    // elements
    let triggerEl = $(this),
      targetEl = $("body");
    // settings
    let classSetting = attr("mode-2", triggerEl.attr("tr-pagecolor-class"));
    // result
    ScrollTrigger.create({
      trigger: triggerEl,
      start: "top center",
      end: "bottom top",
      onToggle: ({ self, isActive }) => {
        if (isActive) {
          targetEl.addClass(classSetting);
        } else {
          targetEl.removeClass(classSetting);
        }
      }
    });
  });
});
