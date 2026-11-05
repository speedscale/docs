const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {chromium} = require('playwright');
const executablePath = process.env.CHROMIUM_EXECUTABLE_PATH;
const [base, stage] = process.argv.slice(2);
assert(base && stage, 'Usage: node verify.cjs BASE_URL before-layout|after|preview');
const output = path.join(__dirname, stage);
fs.mkdirSync(output, {recursive:true});
const cases = [
 ['snapshot', '/guides/creating-a-snapshot/', 'Speedscale Traffic Viewer tutorial'],
 ['transform', '/guides/transformation/overview/', 'Traffic Transform Templates tutorial'],
];
(async () => {
 const result = {observedAt:new Date().toISOString(), base, stage, observations:[], failures:[]};
 const browser = await chromium.launch({headless:true, executablePath});
 try {
  for (const width of [1440, 390]) {
   const context = await browser.newContext({viewport:{width,height:width===1440?1000:844}});
   try {
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    for (const [name, route, title] of cases) {
     const response = await page.goto(base.replace(/\/$/,'') + route, {waitUntil:'networkidle'});
     const iframe = page.locator('main iframe');
     assert.equal(await iframe.count(), 1);
     await iframe.scrollIntoViewIfNeeded();
     const frame = iframe.contentFrame();
     await frame.getByRole('button',{name:'Play video',exact:true}).waitFor();
     const observation = {name,width,url:page.url(),status:response.status(),title:await page.title()};
     observation.iframe = await iframe.evaluate(x => {
      const r=x.getBoundingClientRect();
      return {title:x.getAttribute('title'),ariaLabel:x.getAttribute('aria-label'),ariaLabelledby:x.getAttribute('aria-labelledby'),src:x.src,width:x.getAttribute('width'),height:x.getAttribute('height'),allow:x.getAttribute('allow'),allowfullscreen:x.hasAttribute('allowfullscreen'),tabindex:x.getAttribute('tabindex'),frameborder:x.getAttribute('frameborder'),rect:{x:r.x,width:r.width,height:r.height},pageWidth:document.documentElement.scrollWidth};
     });
     observation.accessibleFrameLines = (await page.locator('main').ariaSnapshot()).split('\n').filter(s=>/^\s*- iframe/.test(s));
     const cdp = await context.newCDPSession(page);
     const {nodes} = await cdp.send('Accessibility.getFullAXTree');
     observation.axFrames = nodes.filter(x=>x.role?.value==='Iframe').map(x=>({role:x.role.value,name:x.name?.value,ignored:x.ignored}));
     await cdp.detach();
     await page.screenshot({path:path.join(output,`${name}-${width}.png`)});
     assert.equal(response.status(),200);
     if (stage==='before-layout') {
      assert.equal(observation.iframe.title,null);
      assert(observation.axFrames.some(x=>!x.name));
     } else {
      assert.equal(observation.iframe.title,title);
      assert(observation.axFrames.some(x=>x.name===title));
     }
     observation.keyboardStart = await iframe.evaluate(x => {
      const previous = [...document.querySelectorAll('a[href],button,input,select,textarea,[tabindex]')].filter(e=>e.tabIndex>=0 && e.getClientRects().length && (e.compareDocumentPosition(x)&Node.DOCUMENT_POSITION_FOLLOWING)).at(-1);
      if (!previous) throw new Error('No focusable element before iframe');
      previous.focus();
      return {tag:previous.tagName,text:previous.textContent.trim().slice(0,120)};
     });
     let tabs=0;
     for (;tabs<90;tabs++) {
      await page.keyboard.press('Tab');
      if (await frame.getByRole('button',{name:'Play video',exact:true}).evaluate(x=>x===document.activeElement)) break;
     }
     observation.tabsToPlay = tabs+1;
     assert(tabs<90,'Play video reachable with Tab');
     await page.keyboard.press('Enter');
     await frame.locator('video').waitFor();
     await page.waitForTimeout(3000);
     observation.playback = await frame.locator('video').evaluateAll(xs=>xs.map(x=>({paused:x.paused,currentTime:x.currentTime,readyState:x.readyState,error:x.error?{code:x.error.code,message:x.error.message}:null})));
     assert(observation.playback.some(x=>!x.paused && x.currentTime>1 && x.readyState>=3 && x.error===null),'Playback progresses after keyboard Enter');
     result.observations.push(observation);
    }
   } finally {await context.close();}
  }
 } catch(error) {result.failures.push({message:error.message,stack:error.stack});process.exitCode=1;}
 finally {
  await browser.close();
  result.cleanup='All owned browser contexts and browser closed. No authentication, remote objects or response stubs.';
  fs.writeFileSync(path.join(output,'verification.json'),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify(result,null,2));
 }
})();
