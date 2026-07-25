const nav=document.getElementById('nav');
addEventListener('scroll',()=>nav.classList.toggle('scrolled',scrollY>80));
const obs=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible')}),{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));

const localImages = Array.from({length: 10}, (_, index) => `imagenes/${index + 1}.png`);
const sectionBackgrounds = [
	{ selector: '.cover', overlay: 'linear-gradient(180deg,rgba(8,8,8,.15),rgba(8,8,8,.22))', image: localImages[0] },
	{ selector: '.manifesto', overlay: 'linear-gradient(180deg,rgba(0,0,0,.18),rgba(0,0,0,.28))', image: localImages[1] },
	{ selector: '.product-hero', overlay: 'linear-gradient(90deg,rgba(0,0,0,.35),rgba(0,0,0,.05) 55%)', image: localImages[2] },
	{ selector: '.chapter.green', overlay: 'linear-gradient(90deg,rgba(0,0,0,.38),rgba(0,0,0,.03) 60%)', image: localImages[3] },
	{ selector: '.chapter.black', overlay: 'linear-gradient(90deg,rgba(0,0,0,.38),rgba(0,0,0,.03) 60%)', image: localImages[4] },
	{ selector: '.chapter.gold', overlay: 'linear-gradient(90deg,rgba(0,0,0,.38),rgba(0,0,0,.03) 60%)', image: localImages[5] },
	{ selector: '.closing', overlay: 'linear-gradient(180deg,rgba(0,0,0,.18),rgba(0,0,0,.35))', image: localImages[6] },
];

sectionBackgrounds.forEach(({ selector, overlay, image }) => {
	const section = document.querySelector(selector);
	if (!section) return;
	section.style.background = `${overlay}, url('${image}')`;
	section.style.backgroundSize = 'cover';
	section.style.backgroundPosition = 'center top';
	section.style.backgroundRepeat = 'no-repeat';
});

document.querySelectorAll('figure img, .swatch img').forEach((img, index) => {
	const imagePath = localImages[index % localImages.length];
	img.src = imagePath;
	img.alt = `Ariel image ${index + 1}`;
	img.loading = 'lazy';
	img.decoding = 'async';
});
