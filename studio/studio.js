'use strict';

const systems = [
  {id:'wall', name:'Настенная сплит-система', type:'cool', use:'Одна комната или небольшая студия.', fit:'Для одной зоны с собственным управлением.', install:'Нужно место на фасаде для наружного блока и маршрут отвода конденсата.', care:'Фильтры доступны из комнаты. Проверьте, можно ли открыть крышку над мебелью.'},
  {id:'multi', name:'Мультисплит', type:'cool', use:'Несколько комнат с одним наружным блоком.', fit:'Для отдельных спален и гостиной, если фасад ограничивает число блоков.', install:'Трассу ведут к каждому внутреннему блоку. Длины и перепады высот проверяют по модели.', care:'Нужен доступ к каждому блоку и к общему наружному модулю.'},
  {id:'duct', name:'Канальный кондиционер', type:'cool', use:'Скрытая установка с подачей воздуха через решётки.', fit:'Когда важны свободные стены и можно согласовать потолок заранее.', install:'Потребуется место под внутренний блок, воздуховоды, люк и дренаж.', care:'Размер и место сервисного люка закладывают до чистовой отделки.'},
  {id:'cassette', name:'Кассетный кондиционер', type:'cool', use:'Распределение охлаждённого воздуха в открытом зале.', fit:'Для переговорных, магазинов и офисов с подвесным потолком.', install:'Уточните высоту за потолком и расстояние до рабочих мест.', care:'Для осмотра фильтра и дренажа нужен доступ к панели снизу.'},
  {id:'supply', name:'Компактный приток', type:'air', use:'Подача наружного воздуха в отдельное помещение.', fit:'Для спальни или кабинета, где важно проветривание при закрытом окне.', install:'Проверьте место прохода через наружную стену и условия согласования.', care:'Для смены фильтров оставьте свободное пространство перед прибором.'},
  {id:'recovery', name:'Приток и вытяжка', type:'air', use:'Организованный воздухообмен для нескольких помещений.', fit:'Для дома или офиса с общей сетью воздуховодов.', install:'Инженер проверит расход воздуха, шум, маршруты каналов и места забора и выброса.', care:'К фильтрам и теплообменнику установки должен оставаться доступ.'}
];
const byId = id => document.getElementById(id);
const systemById = id => systems.find(item => item.id === id);
const types = {cool:'Охлаждение', air:'Свежий воздух'};
const keys = {plan:'aeroforma.studio.plan.v1'};
const propertyOptions = [...byId('property').options].map(item => item.value);
const stageOptions = [...byId('stage').options].map(item => item.value);
const goalOptions = [...byId('room-goal').options].map(item => item.value);
const defaultPlan = () => ({property:propertyOptions[0], stage:stageOptions[0], facade:false, rooms:[], picked:[]});

function readPlan() {
  const fresh = defaultPlan();
  try {
    const saved = JSON.parse(localStorage.getItem(keys.plan));
    if (!saved || typeof saved !== 'object') return fresh;
    if (propertyOptions.includes(saved.property)) fresh.property = saved.property;
    if (stageOptions.includes(saved.stage)) fresh.stage = saved.stage;
    fresh.facade = saved.facade === true;
    if (Array.isArray(saved.rooms)) fresh.rooms = saved.rooms.filter(r => r && typeof r.name === 'string' && r.name.trim() && Number.isFinite(r.area) && r.area >= 1 && r.area <= 2000 && goalOptions.includes(r.goal));
    if (Array.isArray(saved.picked)) fresh.picked = [...new Set(saved.picked.filter(id => systemById(id)))];
  } catch { /* The planner also works without browser storage. */ }
  return fresh;
}
const plan = readPlan();
const compare = new Set();
let filter = 'all';
const number = value => value.toLocaleString('ru-RU', {maximumFractionDigits:1});
function node(tag, text, className) {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className) element.className = className;
  return element;
}
function button(text, className, action) {
  const element = node('button', text, className);
  element.type = 'button';
  element.addEventListener('click', action);
  return element;
}
function announce(id, text) { byId(id).textContent = text; }
function persist() {
  try { localStorage.setItem(keys.plan, JSON.stringify(plan)); }
  catch { announce('plan-status','Чтобы оставить копию плана, скачайте задание.'); }
  renderPlan();
}
function renderCatalog() {
  const host = byId('solutions');
  host.replaceChildren();
  for (const item of systems.filter(s => filter === 'all' || s.type === filter)) {
    const card = node('article', undefined, 'card');
    const top = node('div', undefined, 'card-top');
    const mark = node('span', undefined, 'system-mark ' + item.type);
    mark.setAttribute('aria-hidden','true');
    for (let n=0;n<5;n++) mark.append(node('i'));
    top.append(mark,node('span',types[item.type],'type'));
    const actions = node('div', undefined, 'card-actions');
    const label = node('label', undefined, 'check');
    const check = node('input');
    check.type = 'checkbox';
    check.checked = compare.has(item.id);
    check.setAttribute('aria-label','Сравнить: ' + item.name);
    check.onchange = () => {
      if (check.checked && compare.size === 3) {
        check.checked = false;
        announce('catalog-status','Можно сравнить три системы. Снимите одну отметку, чтобы выбрать другую.');
        return;
      }
      if (check.checked) compare.add(item.id); else compare.delete(item.id);
      updateCompare();
    };
    label.append(check, document.createTextNode('Сравнить'));
    actions.append(button('Подробнее','text-btn',()=>detail(item)),label);
    card.append(top,node('h3',item.name),node('p',item.use),actions);
    host.append(card);
  }
}
function updateCompare() {
  byId('compare').textContent = 'Сравнить (' + compare.size + ')';
  byId('compare').disabled = compare.size < 2;
  announce('catalog-status', compare.size ? 'В сравнении: ' + [...compare].map(id=>systemById(id).name).join(', ') + '.' : '');
}
document.querySelectorAll('[data-filter]').forEach(control => {
  control.onclick = () => {
    filter = control.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===control)));
    renderCatalog();
  };
});
const modal = byId('sheet');
function showSheet(title, ...children) {
  byId('sheet-title').textContent = title;
  byId('sheet-body').replaceChildren(...children);
  modal.showModal();
}
modal.querySelector('.close').onclick = () => modal.close();
modal.addEventListener('click', event => { if(event.target===modal && !event.composedPath().some(el=>el.id==='sheet-body')){ const r=modal.getBoundingClientRect(); if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)modal.close(); } });
const criteria = [['fit','Подходит для'],['install','Условия монтажа'],['care','Обслуживание']];
function detail(item) {
  const parts=[];
  criteria.forEach(([key,title])=>parts.push(node('h3',title),node('p',item[key])));
  parts.push(button(plan.picked.includes(item.id) ? 'Перейти к заданию' : 'Добавить в задание','btn',()=>{
    if(!plan.picked.includes(item.id)) plan.picked.push(item.id);
    persist(); modal.close(); location.hash = 'plan';
    byId('room-name').focus({preventScroll:true});
    announce('plan-status','В задании: ' + item.name + '.');
  }));
  showSheet(item.name,...parts);
}
byId('compare').onclick=()=>{
  const items=[...compare].map(systemById);
  const table=node('table'), head=table.createTHead().insertRow();
  for (const title of ['Параметр',...items.map(s=>s.name)]) {const th=node('th',title);th.scope='col';head.append(th);}
  const body=table.createTBody();
  for (const [key,title] of criteria) {
    const row=body.insertRow(), th=node('th',title); th.scope='row'; row.append(th);
    for(const item of items)row.append(node('td',item[key]));
  }
  const scroll=node('div',undefined,'table-scroll');scroll.tabIndex=0;scroll.setAttribute('role','region');scroll.setAttribute('aria-label','Таблица сравнения систем');scroll.append(table);
  showSheet('Сравнение систем',scroll);
};
function recommendations() {
  const tips=[];
  if (plan.facade) tips.push('Проверить разрешённое место общего наружного блока и трассы до каждой комнаты.');
  if (plan.rooms.some(r=>r.goal.includes('воздух'))) tips.push('Обсудить отдельную подачу наружного воздуха, размещение решёток и доступ к фильтрам.');
  if (plan.rooms.some(r=>r.goal.includes('Охлаждение'))) tips.push('Отметить окна, рабочие и спальные места, чтобы выбрать направление потока.');
  if (plan.property==='Офис') tips.push('Уточнить число сотрудников, загрузку переговорных и часы проведения работ.');
  if (plan.property==='Загородный дом') tips.push('Взять поэтажный план с высотами перекрытий и местами для оборудования.');
  tips.push(plan.stage==='Чистовая отделка готова' ? 'Согласовать видимые участки трассы и защиту готовой отделки.' : 'Нанести трассы, дренаж и сервисные люки на план до закрытия потолка.');
  return tips;
}
function renderPlan() {
  byId('property').value=plan.property; byId('stage').value=plan.stage; byId('facade').checked=plan.facade;
  byId('brief-title').textContent=plan.property;
  const total=plan.rooms.reduce((sum,r)=>sum+r.area,0);
  byId('totals').textContent=plan.rooms.length ? 'Помещений: '+plan.rooms.length+' · Общая площадь: '+number(total)+' м²' : 'Добавьте первое помещение, чтобы собрать задание.';
  const list=byId('rooms'); list.replaceChildren();
  plan.rooms.forEach((r,index)=>{
    const li=node('li'), caption=node('span',r.name+' · '+number(r.area)+' м² · '+r.goal);
    const remove=button('Убрать','',()=>{plan.rooms.splice(index,1);persist();announce('plan-status','Помещение удалено: '+r.name+'.');});
    remove.setAttribute('aria-label','Убрать помещение '+r.name);
    li.append(caption,remove);list.append(li);
  });
  const picked=byId('picked');picked.replaceChildren();
  if(plan.picked.length){
    picked.append(node('strong','Системы для обсуждения'));
    const ul=node('ul');for(const id of plan.picked){const li=node('li'),name=systemById(id).name;const remove=button('Убрать','',()=>{plan.picked=plan.picked.filter(s=>s!==id);persist();});
      remove.setAttribute('aria-label','Убрать систему '+name);li.append(node('span',name),remove);ul.append(li);}picked.append(ul);
  }
  const advice=byId('advice');advice.replaceChildren();
  if(plan.rooms.length)advice.append(node('strong','Обсудить на замере'),...recommendations().map(t=>node('p',t)));
  byId('export').disabled=!plan.rooms.length;
}
['property','stage','facade'].forEach(id=>{byId(id).onchange=()=>{plan[id]=id==='facade'?byId(id).checked:byId(id).value;persist();};});
byId('room-form').onsubmit=event=>{
  event.preventDefault();
  const name=byId('room-name'), area=byId('room-area'), label=name.value.trim();
  if(!label){name.setCustomValidity('Введите название помещения.');name.reportValidity();return;}
  plan.rooms.push({name:label,area:area.valueAsNumber,goal:byId('room-goal').value});
  persist(); event.currentTarget.reset();name.focus();
  announce('plan-status','Добавлено помещение: '+label+'.');
};
byId('room-name').oninput=event=>event.target.setCustomValidity('');
byId('export').onclick=()=>{
  const lines=['Аэроформа · Задание на замер',plan.property+' · '+plan.stage,byId('totals').textContent,'','Помещения',...plan.rooms.map((r,i)=>(i+1)+'. '+r.name+' · '+number(r.area)+' м² · '+r.goal)];
  if(plan.facade)lines.push('','Условие: на фасаде можно разместить только один наружный блок.');
  if(plan.picked.length)lines.push('','Системы для обсуждения',...plan.picked.map(id=>systemById(id).name));
  lines.push('','Обсудить на замере',...recommendations().map(t=>'• '+t));
  const url=URL.createObjectURL(new Blob(['\uFEFF'+lines.join('\r\n')],{type:'text/plain;charset=utf-8'}));
  const a=node('a');a.href=url;a.download='Аэроформа — задание на замер.txt';document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),2000);
};
renderCatalog();updateCompare();renderPlan();
