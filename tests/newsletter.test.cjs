const {test,before,after,beforeEach}=require('node:test');
const assert=require('node:assert/strict');
const realFetch=global.fetch;
let server,base,calls,admin,resend,ip=0;

before(async()=>{
 process.env.SHOPIFY_STORE_DOMAIN='newsletter.test';process.env.SHOPIFY_STOREFRONT_TOKEN='test';
 global.fetch=async(url,options={})=>{
  const {hostname,pathname}=new URL(url);
  if(hostname==='api.resend.com'){calls.push({resend:JSON.parse(options.body)});return new Response('{}',{status:resend});}
  assert.equal(hostname,'newsletter.test');
  if(pathname==='/admin/oauth/access_token'){
   calls.push({token:Object.fromEntries(new URLSearchParams(options.body))});
   return Response.json({access_token:'admin-token',expires_in:86399});
  }
  const {query,variables}=JSON.parse(options.body);
  if(pathname.startsWith('/admin/api/')){
   assert.equal(options.headers['X-Shopify-Access-Token'],'admin-token');
   calls.push({query:query.match(/(mutation|query) (\w+)/)[2],variables});
   return admin(query,variables);
  }
  return Response.json({data:{}});
 };
 server=require('../server').listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));base=`http://127.0.0.1:${server.address().port}`;
});
after(async()=>{global.fetch=realFetch;await new Promise(r=>server.close(r));});
beforeEach(()=>{calls=[];resend=200;process.env.SHOPIFY_ADMIN_TOKEN='admin-token';process.env.RESEND_API_KEY='resend';delete process.env.SHOPIFY_ADMIN_CLIENT_ID;delete process.env.SHOPIFY_ADMIN_CLIENT_SECRET;});

// Chaque test utilise sa propre adresse IP : le limiteur anti-abus reste actif.
const subscribe=email=>realFetch(base+'/api/newsletter',{method:'POST',headers:{'Content-Type':'application/json','X-Forwarded-For':`10.0.0.${++ip}`},body:JSON.stringify({email})});

test('a new address becomes a subscribed Shopify customer, without a fallback email',async()=>{
 admin=()=>Response.json({data:{customerCreate:{customer:{id:'gid://shopify/Customer/1'},userErrors:[]}}});
 const r=await subscribe(' Lea@Example.be ');
 assert.equal(r.status,200);assert.deepEqual(await r.json(),{ok:true,saved:'created'});
 assert.equal(calls.length,1);
 assert.deepEqual(calls[0].variables.input,{email:'lea@example.be',tags:['newsletter','site-web'],emailMarketingConsent:{marketingState:'SUBSCRIBED',marketingOptInLevel:'SINGLE_OPT_IN'}});
});

test('an existing customer is subscribed and tagged instead of being duplicated',async()=>{
 admin=query=>/customerCreate/.test(query)?Response.json({data:{customerCreate:{customer:null,userErrors:[{field:['email'],message:'Email has already been taken'}]}}})
  :/customers\(/.test(query)?Response.json({data:{customers:{nodes:[{id:'gid://shopify/Customer/7'}]}}})
  :Response.json({data:{customerEmailMarketingConsentUpdate:{userErrors:[]},tagsAdd:{userErrors:[]}}});
 const r=await subscribe('client@example.be');
 assert.deepEqual(await r.json(),{ok:true,saved:'subscribed'});
 assert.deepEqual(calls.map(c=>c.query),['NewsletterCreate','NewsletterCustomer','NewsletterConsent']);
 assert.equal(calls[1].variables.query,'email:"client@example.be"');
 assert.equal(calls[2].variables.id,'gid://shopify/Customer/7');
 assert.equal(calls[2].variables.input.emailMarketingConsent.marketingState,'SUBSCRIBED');
});

test('when Shopify refuses, the shop receives the address by email',async()=>{
 admin=()=>new Response('{}',{status:403});
 const r=await subscribe('secours@example.be');
 assert.deepEqual(await r.json(),{ok:true,saved:'email'});
 const mail=calls.find(c=>c.resend).resend;
 assert.equal(mail.to,'shop@mikadodeco.be');assert.match(mail.subject,/secours@example\.be/);assert.match(mail.text,/Shopify Admin 403/);
});

test('without an Admin token, the address is still kept by email',async()=>{
 delete process.env.SHOPIFY_ADMIN_TOKEN;
 const r=await subscribe('sans-jeton@example.be');
 assert.deepEqual(await r.json(),{ok:true,saved:'email'});
 assert.equal(calls.length,1);assert.match(calls[0].resend.text,/application Shopify non configurée/);
});

test('the visitor is never told they are subscribed when nothing was saved',async()=>{
 admin=()=>new Response('{}',{status:500});resend=500;
 const r=await subscribe('perdu@example.be');
 assert.equal(r.status,502);assert.deepEqual(await r.json(),{error:'delivery_failed'});
});

test('an invalid address is rejected before any call',async()=>{
 const r=await subscribe('pas-un-email');
 assert.equal(r.status,400);assert.equal(calls.length,0);
});

test('a Dev Dashboard app exchanges its credentials once, then reuses the 24-hour token',async()=>{
 delete process.env.SHOPIFY_ADMIN_TOKEN;process.env.SHOPIFY_ADMIN_CLIENT_ID='client';process.env.SHOPIFY_ADMIN_CLIENT_SECRET='secret';
 admin=()=>Response.json({data:{customerCreate:{customer:{id:'gid://shopify/Customer/2'},userErrors:[]}}});
 assert.deepEqual(await(await subscribe('un@example.be')).json(),{ok:true,saved:'created'});
 assert.deepEqual(await(await subscribe('deux@example.be')).json(),{ok:true,saved:'created'});
 const tokens=calls.filter(c=>c.token);
 assert.equal(tokens.length,1);
 assert.deepEqual(tokens[0].token,{grant_type:'client_credentials',client_id:'client',client_secret:'secret'});
});
