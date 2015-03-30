// ==UserScript==
// @name            Бухгалтерия объекта и уведомления о работе
// @namespace       https://vk.com/cathome_scripts
// @version			1.2
// @description     Выводит полезные данные об объектах, уведомляет звуком об окончании работы. Подробное описание - внутри файла.
// @author          Lirriella (lirriella@gmail.com)
// @match			http://*/*
// @grant			none
// ==/UserScript==

// Скрипт для cathome.ru.  
/*

ОПИСАНИЕ
Скрипт срабатывает на странице объекта и рассчитывает много всего полезного (для всех, кроме образовательных 
учреждений). 
Список блоков (выводятся в зависимости от типа объекта).
** Общее: информация о рекомендованном балансе, износе (видит только владелец) и последней активности на объекте.
** Бухгалтерия | Бухгалтерия (ремонт): расход, доход и прибыль с производства 1 ед. продукции и 1 нч работы. 
*Для стройки это расходы на ремонт 1 нч. Блок видит только владелец/управляющий.
** Расходы на ремонт: сколько чего не хватает для завершения ремонта.
** Без заголовка: описание и рекомендации.
Подробности по конкретному интересующему значению можно узнать, наведя на него курсор, а также в блоке описания.
** Бонус :) На странице управления объектом скрип добавляет ссылку "-> На страницу объекта" справа внизу.
** Еще бонус :) Скрипт умеет звуком сообщать, когда кот доработал (работает для хрома, мозиллы, новых версий
оперы; не работает для старых версий оперы, возможно, ИЕ; для остальных - неизвестно). Чтобы скрипт уведомлял,
нужно оставить открытой домашнюю страницу (ей не обязательно быть активной, можете делать за компьютером, что
хотите) и не отключать интернет. Если оставите 2 домашние, сработает 2 раза. 

УСТАНОВКА
http://lirriella.my1.ru/index/kak_ustanovit_skript/0-4

*/

(function() {

	var audioUrl = 'http://lirriella.my1.ru/sounds/sweet.mp3';	
	
	var root = typeof unsafeWindow != 'undefined' ? unsafeWindow : window;

	if (root.location.href.indexOf('http://cathome.ru/object.php?id=') >= 0) {
		
		var id;											// id объекта (настройки)

		// объект данных
		var data = {};
		data.root = root;
		
		data.dataNorms = {}; 							// нормы потребления/выработки ресурсов (настройки)

		// настройки объектов недвижимости
		
		id = 371;										// id объекта
		data.dataNorms[id] = {};						
		data.dataNorms[id].mouse			= 0;		// мышь
		data.dataNorms[id].fish				= 0;		// рыба
		data.dataNorms[id].iron				= 0;		// железная руда
		data.dataNorms[id].sand				= 0;		// песок
		data.dataNorms[id].wood				= 0;		// дерево
		data.dataNorms[id].kotix			= 0;		// котикс 
		data.dataNorms[id].pay				= 4/5;		// нч на выработку 1 ед.
		data.dataNorms[id].moneyAddition	= 0;		// сбережения	
		
		id = 404;										// id объекта
		data.dataNorms[id] = {};						
		data.dataNorms[id].mouse			= 1;		// мышь
		data.dataNorms[id].fish				= 1.25;		// рыба
		data.dataNorms[id].iron				= 1;		// железная руда
		data.dataNorms[id].sand				= 0;		// песок
		data.dataNorms[id].wood				= 0;		// дерево
		data.dataNorms[id].kotix			= 7;		// котикс 
		data.dataNorms[id].pay				= 7;		// нч на выработку 1 ед.
		data.dataNorms[id].moneyAddition	= 0;		// сбережения	
					
		// списки общих данных
		//data.dataNorms = {}; 							// нормы потребления/выработки ресурсов (настройки)
		data.dataObjectsStatuses = {}; 					// статусы объектов
		data.dataObjectsTypes = {};						// типы объектов
		data.dataResources = {};						// данные по первичным ресурсам

		// частные данные (конкретного объекта)
		data.object = {};								// свойства объекта
			data.object.common = {};					// общие
		data.object.items= {};							// продукция и ресурсы
			data.object.items.products = {}; 			// продукция
			data.object.items.resources = {}; 			// ресурсы
		data.object.info = {};							// вспомогательная и рассчетная информация
			data.object.info.addition = {};				// вспомогательная
			data.object.info.toShow = {};				// рассчетная (на вывод)
				data.object.info.toShow.factory = {};	// производство
				data.object.info.toShow.shop = {};		// магазин
				data.object.info.toShow.school = {};	// учебное учреждение
				data.object.info.toShow.house = {};		// частная собственность
				data.object.info.toShow.repair = {};	// ремонт
		
		// ======== списки общих данных ========
						
		// статусы объектов

		data.dataObjectsStatuses.repair 	= 'repair';			// ремонт
		data.dataObjectsStatuses.work 		= 'work';			// рабочий
		data.dataObjectsStatuses.idle 		= 'idle';			// простаивает
		data.dataObjectsStatuses.unknow 	= 'unknow';			// неизвестный (значение моё)

		// типы объектов

		data.dataObjectsTypes.factory 		= 'employment'; 	// производственные объекты
		data.dataObjectsTypes.shop 			= 'goods';			// магазин
		data.dataObjectsTypes.school 		= 'education';		// школы
		data.dataObjectsTypes.house 		= 'house';			// дом/склад (значение моё)

		// данные по первичным ресурсам

		data.dataResources.mouse = {};
		data.dataResources.mouse.id	 		= 26;				// id
		data.dataResources.mouse.repairNorm = 0.2;				// потребление за 1 нч при ремонте
		data.dataResources.fish = {};
		data.dataResources.fish.id 			= 27;
		data.dataResources.fish.repairNorm	= 0.25;
		data.dataResources.iron = {};
		data.dataResources.iron.id 			= 5;
		data.dataResources.iron.repairNorm 	= 0.5;
		data.dataResources.sand = {};
		data.dataResources.sand.id 			= 6;
		data.dataResources.sand.repairNorm 	= 0.75;
		data.dataResources.wood = {};
		data.dataResources.wood.id 			= 7;
		data.dataResources.wood.repairNorm 	= 1;
		data.dataResources.kotix = {};
		data.dataResources.kotix.id 		= 85;
		data.dataResources.kotix.repairNorm = 0;

		// ======== частные данные (конкретного объекта) ========

		// свойства объекта

		// общие
		data.object.common.id						= 0;		// id				
		data.object.common.status 					= '';		// статус
		data.object.common.type 					= '';		// тип
		data.object.common.isMy 					= false;	// is my
		data.object.common.pay 						= 0;		// з/п
		data.object.common.payOne					= 0;		// з/п на производство 1 ед
		data.object.common.payCount					= 0;		// ед. на 1 з/п (нч - для стройки)
		data.object.common.hours					= 0;		// нч до окончания ремонта
		data.object.common.money 					= 0;		// баланс
		data.object.common.moneyToResources			= 0;		// нужно денег, чтобы заполнить склад ресурсов
		data.object.common.moneyToProducts			= 0;		// нужно денег, чтобы заполнить склад продукции
		data.object.common.moneyToPay 				= 0;		// нужно денег на з/п
		data.object.common.moneyToResourcesRepair 	= 0;		// нужно денег на ресурсы при строительстве
		data.object.common.moneyToAddition			= 0;		// дополнительные расходы (запас на устройство с па игрока с макс. производом)
		data.object.common.moneyToResourcesNeed		= 0;		// не хватает на ресурсы на ремонт
		data.object.common.rateOne					= 0;		// расход на 1 нч ремонта/ 1 ед продукции
		data.object.common.profitItem				= 0;		// прибыль за 1 ед продукции
		data.object.common.profitHour				= 0;		// прибыль за 1 нч
		data.object.common.profitFullDiff			= 0;		// прибыль за всё свободное место
		data.object.common.recommendedMoney			= 0;		// рекомендованный баланс
		data.object.common.missingMoney 			= 0;		// на счете не хватает

		// вспомогательная и рассчетная информация

		// вспомогательная
		data.object.info.addition.correctSpan				= 0; 		// дополнительное поле для корректировки спанов
		data.object.info.addition.currentItemType			= 0; 		// тип текущего ресурса/предмета при переборе
		data.object.info.addition.onlyFloal 				= ''; 		// выбрать числа с плавающей точкой (регулярное выражение)
		data.object.info.addition.maxCoefficientProduction 	= 6.29*2; 	// максимальный коэффициент производа для рассчета запаса на ремонт (с учетом ПА)

		// рассчетная (на вывод)
			
		// производство
		data.object.info.toShow.factory.show 	= ''; 	// полные данные для вывода, включая оформление

		// магазин
		data.object.info.toShow.shop.show 		= ''; 	// полные данные для вывода, включая оформление
		
		// учебное учреждение	
		data.object.info.toShow.school.show 	= ''; 	// полные данные для вывода, включая оформление
		
		// частная собственность
		data.object.info.toShow.house.show 		= ''; 	// полные данные для вывода, включая оформление

		//  ремонт
		data.object.info.toShow.repair.show 	= '';	 // полные данные для вывода, включая оформление

		// выполнить

		setValues(data); 	// рассчитать данные
		showInfo(data);		// вывести данные
	}
	// ссылка на страницу объекта из управления
	else if (root.location.href.indexOf('http://cathome.ru/object-management.php?id=') >= 0) 
	{	
		var ul = root.document.getElementsByClassName('sidebar-nav');
		if (0 < ul.length)
		{
			var exp = new RegExp('\\-?\\d+(\\.\\d{0,})?','g');
			var idObject = root.location.href.match(exp); 
			ul[0].innerHTML += '<li><a href="http://cathome.ru/object.php?id='+idObject+'"><span>-> На страницу объекта</span></a></li>';
		}	
	}
	
	// уведомить об окончании работы
	if (root.location.href.indexOf('http://cathome.ru/home.php') >= 0)
	{
		endOfWork(audioUrl, root);
	}
	
	// =================================================================================================
	// основное: оформление и вывод, общий рассчет данных
	
	// окончательный вывод
	function showInfo(data)
	{
		var msgPlace = data.root.document.getElementsByClassName('side-block');
		msgPlace[0].innerHTML = msgPlace[0].innerHTML 
			//+ "<div class='sidebar'>"
				+data.object.info.toShow.factory.show
				+data.object.info.toShow.shop.show 
				+data.object.info.toShow.school.show 
				+data.object.info.toShow.house.show
				+data.object.info.toShow.repair.show
			//+"</div>" 
			;
	}

	// функция для тестирования
	function test(data)
	{
		var msgPlace = data.root.document.getElementsByClassName('sidebar');
		msgPlace[0].innerHTML = msgPlace[0].innerHTML 
			+ "<div class='script-msg sidebar-nav' style='font-size: 12px;'>"
				+"--- info<br>"
				+''+data.object.info.toShow.factory.show
				+''+data.object.info.toShow.shop.show
				+''+data.object.info.toShow.school.show
				+''+data.object.info.toShow.house.show
				+''+data.object.info.toShow.repair.show
				+"<br>"+"<br>"
				+"--- common<br>"
				+"<div style='float:left; text-align:left; width:150px'>id 						</div><div style='float:left; text-align:right'>"+data.object.common.id+"</div><div class=''></div><br>"
				+"<div style='float:left; text-align:left; width:150px'>status					</div><div style='float:left; text-align:right'>"+data.object.common.status +"</div><div class=''></div><br>"
				+"<div style='float:left; text-align:left; width:150px'>type					</div><div style='float:left; text-align:right'>"+data.object.common.type+"</div><div class=''></div><br>"
				+"<div style='float:left; text-align:left; width:150px'>isMy					</div><div style='float:left; text-align:right'>"+data.object.common.isMy+"</div><div class=''></div><br>"
				+"<div style='float:left; text-align:left; width:150px'>pay						</div><div style='float:left; text-align:right'>"+data.object.common.pay+"</div><div class=''></div><br>"
				+"<div style='float:left; text-align:left; width:150px'>payOne					</div><div style='float:left; text-align:right'>"+data.object.common.payOne+"</div><div class=''></div><br>"
				+"<div style='float:left; text-align:left; width:150px'>payCount				</div><div style='float:left; text-align:right'>"+data.object.common.payCount+"</div><div class=''></div><br>"
				+"<div style='float:left; text-align:left; width:150px'>hours					</div><div style='float:left; text-align:right'>"+data.object.common.hours+"</div><div class=''></div><br>"
				+"<div style='float:left; text-align:left; width:150px'>money					</div><div style='float:left; text-align:right'>"+data.object.common.money+"</div><div class=''></div><br>"
				+"<div style='float:left; text-align:left; width:150px'>moneyToResources		</div><div style='float:left; text-align:right'>"+data.object.common.moneyToResources+"</div><div class=''></div><br>"
				+"<div style='float:left; text-align:left; width:150px'>moneyToProducts			</div><div style='float:left; text-align:right'>"+data.object.common.moneyToProducts+"</div><div class=''></div><br>"
				+"<div style='float:left; text-align:left; width:150px'>moneyToPay				</div><div style='float:left; text-align:right'>"+data.object.common.moneyToPay+"</div><div class=''></div><br>"
				+"<div style='float:left; text-align:left; width:150px'>moneyToResourcesRepair 	</div><div style='float:left; text-align:right'>"+data.object.common.moneyToResourcesRepair+"</div><div class=''></div><br>"
				+"<div style='float:left; text-align:left; width:150px'>moneyToAddition			</div><div style='float:left; text-align:right'>"+data.object.common.moneyToAddition+"</div><div class=''></div><br>"
				+"<div style='float:left; text-align:left; width:150px'>rateOne					</div><div style='float:left; text-align:right'>"+data.object.common.rateOne+"</div><div class=''></div><br>"
				+"<div style='float:left; text-align:left; width:150px'>profitItem				</div><div style='float:left; text-align:right'>"+data.object.common.profitItem+"</div><div class=''></div><br>"
				+"<div style='float:left; text-align:left; width:150px'>profitHour				</div><div style='float:left; text-align:right'>"+data.object.common.profitHour+"</div><div class=''></div><br>"
				+"<div style='float:left; text-align:left; width:150px'>profitFullDiff			</div><div style='float:left; text-align:right'>"+data.object.common.profitFullDiff+"</div><div class=''></div><br>"
				+"<div style='float:left; text-align:left; width:150px'>recommendedMoney		</div><div style='float:left; text-align:right'>"+data.object.common.recommendedMoney+"</div><div class=''></div><br>"
				+"<div style='float:left; text-align:left; width:150px'>missingMoney			</div><div style='float:left; text-align:right'>"+data.object.common.missingMoney+"</div><div class=''></div><br>"
			+"</div>" ;		
	}

	// задать значения
	function setValues(data)
	{
		data.object.info.addition.onlyFloal = new RegExp('\\-?\\d+(\\.\\d{0,})?','g'); 

		// объекты - общее
		
		data.object.common.id					= getObjectId(data);			
		data.object.common.status 				= getObjectStatus(data);	
		data.object.common.type		 			= getObjectType(data);
		data.object.common.isMy 				= checkObjectIsMy(data);
		data.object.common.money 				= getObjectMoney(data);
		data.object.common.pay 					= getObjectPay(data);	
		data.object.common.payOne				= getObjectPayOne(data);
		data.object.common.payCount				= getObjectPayCount(data);
		data.object.common.hours				= getObjectRepairHours(data);

		// ресурсы/продукция
		
		calcItemValues(data);

		// расход/прибыль на 1 нч/ед
		
		data.object.common.rateOne 			= getRateOne(data);
		data.object.common.profitItem 		= getProfitItem(data);
		data.object.common.profitHour 		= getProfitHour(data);
		data.object.common.profitFullDiff 	= getProfitFullDiff(data);
		
		// рекомендации по балансу

		data.object.common.moneyToResources		= calcMoneyToResources(data);	
		data.object.common.moneyToProducts		= calcMoneyToProducts(data);	
		data.object.common.moneyToPay 			= calcMoneyToPay(data);	
		data.object.common.moneyToResourcesRepair 	= calcMoneyToResourcesRepair(data);
		data.object.common.moneyToAddition 		= calcMoneyToAddition(data);
		data.object.common.moneyToResourcesNeed = calcMoneyToResourcesNeed(data);
		
		data.object.common.recommendedMoney 	= calcRecommendedMoney(data);
		data.object.common.missingMoney 		= calcMissingMoney(data);

		// данные для вывода

		data.object.info.toShow.factory.show 	= getShowFactory(data); 
		data.object.info.toShow.shop.show 		= getShowShop(data); 
		data.object.info.toShow.school.show 	= getShowSchool(data); 
		data.object.info.toShow.house.show 		= getShowHouse(data); 
		data.object.info.toShow.repair.show 	= getShowRepair(data);
		
		// ajax
		
		getAjaxPercent();		
		getAjaxResourcesLastDate();
		getAjaxProductsLastDate();
		getAjaxWorkLastDate();
	}
	
	// данные на вывод для производства
	function getShowFactory(data)
	{
		var html = '';
		if (isFactory(data))
		{
			html += getMoneyHTML(data);
			html += getResProdFactoryHTML(data);
			html += getInfoHTML();
		}
		return html;
	}

	// данные на вывод для магазина
	function getShowShop(data)
	{
		var html = '';
		if (isShop(data))
		{
			html += getMoneyHTML(data);
			html += getResProdShopHTML(data);
			html += getInfoHTML();
		}
		return html;
	}

	// данные на вывод для учебных заведений
	function getShowSchool(data)
	{
		var html = '';
		// для школ ничего не выводить
		if (isSchool(data))
		{
			html = '';
		}
		return html; 	
	}

	// данные на вывод для частной собственности
	function getShowHouse(data)
	{
		var html = '';
		if (isHouse(data))
		{
			html += getMoneyHTML(data);
		}
		return html; 
	}

	// данные на вывод для стройки
	function getShowRepair(data)
	{
		var html = '';
		if (isRepair(data))
		{
			html += getMoneyHTML(data);
			html += getResProdRepairHTML(data);
			html += getResRepairHTML(data);
			html += getInfoHTML();
		}
		return html;
	}

	// оформление разделов
	function getContentHTML(title, body, fullTitle)
	{
			var html = "";
			
			html += "<div class='script-msg side-block area-info' style='padding:0; margin:0; font-size: 12px; line-height: 16px;'>";
				html += "<div class='title' style='margin-top: 0px;'></div>";
				if (title) {
					html += "<h4 title='"+fullTitle+"'>"+title+"</h4>";
				}
					html += "<div style='margin-top: 15px;'>";
					html += body;
				html += "</div>";
				html += "<div class='clear'></div>";
			html += "</div>";
			
			return html;
	}

	// рекомендации по балансу
	function getMoneyHTML(data)
	{
			var html;
			var title = 'Общее';
			var body = "";
			var minWidth = 160;
			var date = new Date();
			
			var day = date.getDate();
			if (day <= 9){
				day = '0'+day;
			}
				
			var month = date.getMonth()+1;
			if (month <= 9){
				month = '0'+month;
			}
			
			var today = day+'.'+month+'.'+date.getFullYear();

			body += "<div title='" +
					"Минимальный баланс объекта для его гарантированной работоспособности " +
					"(при износе меньше 50% и соответствующем статусе).\n" +
					"В зависимости от типа объекта, учитывается:\n" +
					"- сумма для заполнения склада ресурсов;\n" +
					"- сумма на выработку продукции до полного заполнения склада;\n" +
					"- сумма сбережений;\n" +
					"- сумма, необходимая для окончания ремонта, + запас.\n" +
					"Подробнее - см. ниже." +
					"'><span style='min-width:"+minWidth+"px; float:left;'>Рекомендованный баланс: </span> "+Math.ceil(data.object.common.recommendedMoney)+" чО</div><div class='clear'></div>";
			/*body += "<div style='padding-left:20px'>В том числе:</div>";
			if(data.object.common.moneyToResources > 0){
				body +="<div style='padding-left:20px'><span style='min-width:180px; float:left;'>Заполн. склад ресурсов: </span> "+Math.ceil(data.object.common.moneyToResources)+" чО</div><div class='clear'></div>"
			}
			if(data.object.common.moneyToProducts > 0){
				body +="<div style='padding-left:20px'><span style='min-width:180px; float:left;'>Заполн. склад продукции: </span> "+Math.ceil(data.object.common.moneyToProducts)+" чО</div><div class='clear'></div>"
			}
			if(data.object.common.moneyToPay > 0){
				body +="<div style='padding-left:20px'><span style='min-width:180px; float:left;'>На з/п: </span> "+Math.ceil(data.object.common.moneyToPay)+" чО</div><div class='clear'></div>"
			}
			if(data.object.common.moneyToResourcesRepair > 0){
				body +="<div style='padding-left:20px'><span style='min-width:180px; float:left;'>На ремонт (ресурсы): </span> "+Math.ceil(data.object.common.moneyToResourcesRepair)+" чО</div><div class='clear'></div>"
			}
			if(data.object.common.moneyToAddition > 0){
				body +="<div style='padding-left:20px'><span style='min-width:180px; float:left;'>Запас: </span> "+Math.ceil(data.object.common.moneyToAddition)+" чО</div><div class='clear'></div>"
			}*/
			
			if (data.object.common.isMy && data.dataNorms[data.object.common.id])
			{
				body += "<div title='Сумма, которая просто хранится на счете объекта и" +
					"не участвует в расчетах.'><span style='min-width:"+minWidth+"px; float:left;'>Сбережения: </span> "+data.dataNorms[data.object.common.id].moneyAddition+" чО</div><div class='clear'></div>";
			}
			body += "<div title='Не хватает на счете объекта до рекомендованной суммы. " +
			"Если число отрицательное, это прибыль, которую можно снять.'><span style='min-width:"+minWidth+"px; float:left;'>На счете не хватает: </span> "+Math.ceil(data.object.common.missingMoney)+" чО</div><div class='clear'></div>";
	
			body += "<br>";
			
			if (data.object.common.isMy){
				body += "<div title='При износе больше 50% выработка уменьшается, и постепенно объект станет работать в убыток.'><span style='min-width:"+minWidth+"px; float:left;'>Процент износа: </span><div id='ajax-percent'></div></div><div class='clear'></div>";
			}
			body += "<div title='Последняя дата, когда кто-то сдал ресурсы на объект.'><span style='min-width:"+minWidth+"px; float:left;'>Последняя покупка рес.: </span><div id='ajax-resources-last-date'></div></div><div class='clear'></div>";
			body += "<div title='Последняя дата, когда кто-то купил продукцию объекта.'><span style='min-width:"+minWidth+"px; float:left;'>Последняя продажа прод.: </span><div id='ajax-products-last-date'></div></div><div class='clear'></div>";
			body += "<div title='Последняя дата, когда кто-то устроился работать на объект.'><span style='min-width:"+minWidth+"px; float:left;'>Последнее устройство: </span><div id='ajax-work-last-date'></div></div><div class='clear'></div>";
			
			if (isFactory(data) || isShop(data))
			{
				body += "<br>";
				body += "<div title='Т.е. через 2 недели после последней покупки/продажи/устройства." +
						"Простаивающий объект через какое-то время попадает в лотерею, следите за статусом, " +
						"чтобы не потерять недвижимость. Частная собственность (дома и склады) не изнашиваются." +
						"'>Объект уйдет в простой после 2 недель неактивности. Сегодня "+today+".</div>";	
			}
			
			html = getContentHTML(title, body, "Общие данные об объекте.");

			return html;
	}

	// ресурсы и продукция (производство)
	function getResProdFactoryHTML(data)
	{
			var html = '';
			
			if (isFactory(data) && data.object.common.isMy)
			{
				var title = 'Бухгалтерия';
	
				// если заданы настройки, показать
				if (data.dataNorms[data.object.common.id]) 
				{
					
					var style1 = "style='min-width:98px; float:left;'";
					var style2 = "style='min-width:52px; float:left;'";
					var style3 = "style='min-width:52px; float:left;'";
					var style4 = "style='min-width:58px; float:left;'";
					var style5 = "style='min-width:160px; float:left;'";
					var style6 = "style='min-width:100px; float:left;'";
					
					var body = "<div title='Потребление ресурсов на выработку 1 ед. продукции.'>";
					
					body += "<div "+style1+"> Название </div>"
							+"<div "+style2+"> Цена </div>"
							+"<div "+style3+"'> Расход </div>"
							+"<div "+style4+"'> Сумма </div>"
							+"<div class='clear'></div>";
	
					for(var resAlias in data.dataNorms[data.object.common.id])
					{
						for (var resId in data.object.items.resources)
						{
							if (data.dataResources[resAlias] && data.dataResources[resAlias].id == resId)
							{
								body += "<div "+style1+">"+data.object.items.resources[resId].name+"</div>"
									+"<div "+style2+">"+data.object.items.resources[resId].price+"</div>"
									+"<div "+style3+">"+data.object.items.resources[resId].norm+"</div>"
									+"<div "+style4+">"+(Math.round((data.object.items.resources[resId].priceOne)*100)/100)+"</div>"
									+"<div class='clear'></div>";
							}
						}
					}
					
					body += "<div "+style1+">З/п</div>"
						+"<div "+style2+">"+data.object.common.pay +"</div>"
						+"<div "+style3+">"+data.dataNorms[data.object.common.id].pay+"</div>"
						+"<div "+style4+">"+(Math.round((data.object.common.payOne)*100)/100)+"</div>"
						+"<div class='clear'></div>";
					
					body += '</div>';
					body += "<br>";
					
					body += "<div title='Сумма, необходимая на выработку 1 ед. продукции.'><div "+style5+"> Расход на 1 ед.: </div>"
						+"<div "+style6+">"+(Math.round((data.object.common.rateOne)*100)/100)+" чО</div>"
						+"<div class='clear'></div></div>";
					
					body += "<div title='Чистая прибыль с 1 ед. продукции.'><div "+style5+"> Прибыль с 1 ед.: </div>"
					+"<div "+style6+">"+(Math.round((data.object.common.profitItem)*100)/100)+" чО</div>"
					+"<div class='clear'></div></div>";
					
					body += "<div title='Чистая прибыль с 1 нч (устройство игрока с 0 производом на 30 мин.)'><div "+style5+"> Прибыль с 1 нч: </div>"
					+"<div "+style6+">"+(Math.round((data.object.common.profitHour)*100)/100)+" чО</div>"
					+"<div class='clear'></div></div>";
					
					// !!! В перспективе сделать рассчет при сдаче в ГОС
					if (data.dataNorms[data.object.common.id] && (data.dataNorms[data.object.common.id].gosProfit || data.dataNorms[data.object.common.id].gosProfit === 0))
					{
						body += "<div title='Прибыль за 1 нч, если сдавать в ГОС (рассчитывается и задается вручную)'><div "+style5+"> Прибыль с 1 нч (ГОС): </div>"
						+"<div "+style6+">"+data.dataNorms[data.object.common.id].gosProfit+" чО</div>"
						+"<div class='clear'></div></div>";
					}

				}
				else
				{
					body = 'Укажите данные по потреблению ресурсов для этого объекта (см. файл скрипта).';
				}
	
				html = getContentHTML(title, body, "Расходы, доходы, прибыль объекта с 1 ед. продукции или за 1 нч (устройство игрока с 0 производом на 30 мин.).");
			}
			
			return html;
	}

	// ресурсы и продукция (магазин)
	function getResProdShopHTML(data)
	{
		var html = '';
		
		if (isShop(data) && data.object.common.isMy)
		{
			var title = 'Бухгалтерия';
			
			var style1 = "style='min-width:94px; float:left;'";
			var style2 = "style='min-width:53px; float:left;'";
			var style3 = "style='min-width:57px; float:left;'";
			var style4 = "style='min-width:53px; float:left;'";
			
			var body = "<div title='Продукция магазина.'>";
			
			body += "<div "+style1+"> Название </div>"
					+"<div "+style2+"> Покупка </div>"
					+"<div "+style3+"'> Продажа </div>"
					+"<div "+style4+"'> Прибыль </div>"
					+"<div class='clear'></div>";
			
			var name, points;
				
			for(var resId in data.object.items.resources)
			{
				if (data.object.items.products[resId])
				{
					name = data.object.items.resources[resId].name.substring(0,11);
					
					points = '';
					if (data.object.items.resources[resId].name.length > name.length){
						points = '...';
					}
					body +="<div title='"+data.object.items.resources[resId].name+"' "+style1+">"+name+points+" </div>"
						+"<div "+style2+">"+data.object.items.products[resId].price+"</div>"
						+"<div "+style3+"'>"+data.object.items.resources[resId].price+"</div>"
						+"<div "+style4+"'>"+(parseFloat(data.object.items.products[resId].price,10) - parseFloat(data.object.items.resources[resId].price,10))+"</div>"
						+"<div class='clear'></div>";
				}
			}
			
			body += '</div>';
			
			html = getContentHTML(title, body, "Расходы, доходы, прибыль объекта с 1 ед. продукции.");
		}
		return html;
	}

	// ресурсы и продукция (ремонт)
	function getResProdRepairHTML(data)
	{
		var html = '';
		
		if (isRepair(data) && data.object.common.isMy)
		{
			var title = 'Бухгалтерия (ремонт)';
				
			var style1 = "style='min-width:98px; float:left;'";
			var style2 = "style='min-width:52px; float:left;'";
			var style3 = "style='min-width:52px; float:left;'";
			var style4 = "style='min-width:58px; float:left;'";
			var style5 = "style='min-width:160px; float:left;'";
			var style6 = "style='min-width:100px; float:left;'";
			
			var body = "<div title='Потребление ресурсов за 1 нч (устройство игрока с 0 производом на 30 мин.).'>";
			
			body += "<div "+style1+"> Название </div>"
					+"<div "+style2+"> Цена </div>"
					+"<div "+style3+"'> Расход </div>"
					+"<div "+style4+"'> Сумма </div>"
					+"<div class='clear'></div>";

			for (var resId in data.object.items.resources)
			{
						
				body +="<div "+style1+">"+data.object.items.resources[resId].name+"</div>"
					+"<div "+style2+">"+data.object.items.resources[resId].price+"</div>"
					+"<div "+style3+">"+data.object.items.resources[resId].norm+"</div>"
					+"<div "+style4+">"+(Math.round((data.object.items.resources[resId].priceOne)*100)/100)+"</div>"
					+"<div class='clear'></div>";
			}

			body += "<div "+style1+">З/п</div>"
				+"<div "+style2+">"+data.object.common.pay +"</div>"
				+"<div "+style3+">1</div>"
				+"<div "+style4+">"+data.object.common.pay+"</div>"
				+"<div class='clear'></div>";
			
			body += "</div>";
			body += "<br>";
				
			body += "<div title='Сумма, необходимая на ремонт 1 нч.'><div "+style5+"> Расход за 1 нч: </div>"
				+"<div "+style6+">"+(Math.round((data.object.common.rateOne)*100)/100)+" чО</div>"
				+"<div class='clear'></div></div>";

			html = getContentHTML(title, body, "Расходы объекта за 1 нч (устройство игрока с 0 производом на 30 мин.).");
		}
		return html;
	}

	// ресурсы для стройки
	function getResRepairHTML(data)
	{
		var html = '';

		if (isRepair(data))
		{
			var title = 'Расходы на ремонт';
			
			var style1 = "style='min-width:110px; float:left;'";
			var style2 = "style='min-width:75px; float:left;'";
			var style3 = "style='min-width:75px; float:left;'";
			var style4 = "style='min-width:150px; float:left;'";
			var style5 = "style='min-width:100px; float:left;'";
			
			var body = "<div title='Ресурсы, которых не хватает для завершения ремонта.'>";
			
			body += "<div "+style1+"> Название </div>"
					+"<div "+style2+"> Не хватает </div>"
					+"<div "+style3+"'> На сумму </div>"
					+"<div class='clear'></div>";
			
			for (var resId in data.object.items.resources)
			{
						
				body += "<div "+style1+">"+data.object.items.resources[resId].name+"</div>"
					+"<div "+style2+">"+data.object.items.resources[resId].countDiffRepairNeed+"</div>"
					+"<div "+style3+"'>"+data.object.items.resources[resId].priceDiffRepairNeed+"</div>"
					+"<div class='clear'></div>";
			}
			
			body += "<div "+style1+">З/п</div>"
				+"<div "+style2+">"+data.object.common.hours+"</div>"
				+"<div "+style3+"'>"+Math.ceil(data.object.common.moneyToPay)+"</div>"
				+"<div class='clear'></div>";
			
			body += "</div>";
			body += "<br>";

			body += "<div title='Минимальная сумма, необходимая на покупку недостающих ресурсов и выплату з/п. " +
					"Здесь не учтены возможные затраты на заполнение свободного места на складе и т.п. " +
					"(всё остальное учтено в рекомендованном балансе).'><div "+style4+"> Итого нужно минимум: </div>"
			+"<div "+style5+">"+(Math.ceil(parseFloat(data.object.common.moneyToResourcesNeed,10))+Math.ceil( parseFloat(data.object.common.moneyToPay,10)))+" чО</div>"
			+"<div class='clear'></div></div>";
			/*
			body += "<br>";
			body += "Обратите внимание, рекомендуемый баланс больше итоговой суммы, т.к. на склад может поместиться больше ресурсов, чем нужно для окончания ремонта. Для экономии стоит ограничить размер склада, когда там будет достаточно ресурсов.";
			*/
			html = getContentHTML(title, body, "Непокрытые расходы объекта на весь ремонт (то, что нужно еще для завершения ремонта).");
		}

		return html;			
	}
	
	// предупреждение
	function getInfoHTML()
	{
		var body = "<div class='script-msg' style='font-size: 12px;'>" +
				"<div title='Да не здесь, выше, на рассчетах :)'>Наведите на текст, чтобы увидеть подсказку, их там много :)</div></br>" +
				"ОПИСАНИЕ<br>" +
				"<div id='alert-text' style='display:none'>" +
				"Тут то, что не поместилось во всплывающие подсказки.<br>" +
				"<br>" +
				"РЕКОМЕНДОВАННАЯ СУММА<br>" +
				"Минимальная сумма, которая должна быть на счете объекта для его гарантированной работоспособности " +
				"(при износе меньше 50% и соответствующем статусе).<br>" +
				"В зависимости от типа объекта, учитывается:<br>" +
				"- сколько денег нужно для заполнения склада ресурсов;<br>" +
				"- какая сумма уйдет на выработку продукции до полного заполнения склада " +
				"(если для объекта не заданы нормы потребления ресурсов, эта сумма будет больше, " +
				"хотя точность рассчетов не пострадает; задать можно в файле скрипта);<br>" +
				"- сумму сбережений (если вы храните деньги на объекте, можно указать сумму сбережений, " +
				"скрипт будет рассчитыва рекомендуемую сумму из рассчета, что сбережения трогать нельзя; " +
				"задать можно в файле скрипта);<br>" +
				"- сумма, необходимая на ресурсы и з/п для окончания ремонта + запас, " +
				"чтобы при 0,5 нч кто-то мог устроиться и доремонтировать объект (только для строек).<br>" +
				"<br>" +
				"ВНИМАНИЕ!<br>" +
				"Все рассчеты выполнены с учетом текущих настроек объекта. Если вы что-то поменяете (лимиты склада, цены и т.д.), результаты получатся другими.<br>" +
				"<br>" +
				"НЕ УЧИТЫВАЮТСЯ СИТУАЦИИ:<br>" +
				"- закрыта покупка/продажа (скрипт всё равно считает с учетом выставленных лимитов);<br>" +
				"- износ объекта больше 50% (мне неизвестна формула изменения выработки), помните, " +
				"в этом случае выработка падает и объект постепенно начнет работать в убыток." +
				"</div>" +
				"<div id='alert-button' title='Кликните по тексту, чтобы показать/скрыть предупреждения.' style='cursor: pointer; font-style: italic;' onclick='" +
				"if(document.getElementById(\"alert-text\").style.display == \"none\")" +
				"{ document.getElementById(\"alert-text\").style.display=\"block\";	document.getElementById(\"alert-button\").innerHTML = \"<br>[скрыть описание]\"; }" +
				"else {	document.getElementById(\"alert-text\").style.display=\"none\"; document.getElementById(\"alert-button\").innerHTML = \"[показать описание]\"; }" +
				"'>[показать описание]</div><br>" +
				"<div title='Или в ЛС игроку Lirriella.' style='float:left;'>Баги, вопросы и предложения по скрипту </div> - <a href='http://cathome.ru/blog/post/31353' target='_blank'>сюда</a>.</div>";
		var html = getContentHTML('', body, '');
		
		return html;
	}
	
	// =================================================================================================
	// функции для заполнения полей (объект)

	// id объекта
	function getObjectId(data)
	{
		return data.root.location.href.match(data.object.info.addition.onlyFloal);
	}		

	// статус объекта
	function getObjectStatus(data)
	{
		var statusName = data.dataObjectsStatuses.unknow;

		for(var key in data.dataObjectsStatuses)
		{
			if (checkStatus(data, data.dataObjectsStatuses[key]))
			{
				statusName = data.dataObjectsStatuses[key];
				break;
			}
		}

		return statusName;
	}	

	// тип объекта
	function getObjectType(data)
	{
		var typeName = data.dataObjectsTypes.house;

		for(var key in data.dataObjectsTypes)
		{
			if (checkType(data, data.dataObjectsTypes[key]))
			{
				typeName = data.dataObjectsTypes[key];
				break;
			}
		}

		return typeName;
	}	

	// мой объект?
	function checkObjectIsMy(data)
	{
		var isMy = false;
		var buttonDiv = data.root.document.getElementsByClassName('object-attack');
		
		if (0 < buttonDiv.length)
		{
			var buttonA= buttonDiv[0].getElementsByTagName('a');
			if (0 < buttonA.length)
			{
				var buttonText = buttonA[0].innerHTML;
				isMy = ('Управление' == buttonText);
			}
		}
		
		return isMy;
	}				

	// баланс объекта
	function getObjectMoney(data)
	{
		var	money = findSpan(data, "Баланс");
		return money;
	}

	// з/п	
	function getObjectPay(data)
	{
		var pay = 0;
		var div = data.root.document.getElementsByClassName('infographic-table');
		
		if (0 < div.length)
		{
			var span3 = div[0].getElementsByClassName('span3');
			if (0 < span3.length)
			{
				var value = span3[0].getElementsByClassName('value');
				if (0 < value.length)
				{
					pay = value[0].innerHTML;
				}
			}
		}
		
		return pay;
	}

	// денег на з/п для производства 1 ед продукции
	function getObjectPayOne(data)
	{
		var pay = 0;
		
		if (data.dataNorms[data.object.common.id])	{
			pay = data.object.common.pay * data.dataNorms[data.object.common.id].pay;
		}

		return pay;
	}

	// ед. на 1 з/п (нч - для стройки)
	function getObjectPayCount(data)
	{
		var count = 0;

		if (isRepair(data)) {
			count = 1;
		}
		else if (data.dataNorms[data.object.common.id]) {
			count = data.dataNorms[data.object.common.id].pay;
		}
		
		return count;
	}

	// нч до окончания ремонта
	function getObjectRepairHours(data)
	{
		var hours = 0;
		
		if (isRepair(data))
		{
			hours = findSpan(data, "Осталось");
		}
		
		return hours;
	}
	
	// =================================================================================================
	// вспомогательные рассчетные функции (объект)

	// поиск нужных данных в списке информации об объекте
	function findSpan(data, value)
	{
		var span4, span4span;
		var number = 0;
		var div = data.root.document.getElementsByClassName('row-fluid');

		for (var i = 0; i <  div.length; i++) 
		{
			span4 = div[i].getElementsByClassName('span4');
			if (span4.length > 0)
			{
				span4span = span4[0].getElementsByTagName('span');
				if (span4span.length > 0)
				{
					if (value == span4span[0].innerHTML)
					{
					 	number = div[i].getElementsByClassName('span8')[0].getElementsByTagName('span')[0].innerHTML.match(data.object.info.addition.onlyFloal);
					}
				}
			}
		}

		return number;
	}
	
	// проверить статус
	function checkStatus(data, statusName)
	{
		var statusData = data.root.document.getElementsByClassName(statusName);
		var isStatus = (statusData.length > 0);
		
		return isStatus;
	}

	// проверить тип
	function checkType(data, typeName)
	{
		var typeData = data.root.document.getElementById(typeName);
		return typeData;
	}

	// стройка?
	function isRepair(data)
	{
		return (data.object.common.status == data.dataObjectsStatuses.repair);
	}

	// производство?
	function isFactory(data)
	{
		return ((data.object.common.type == data.dataObjectsTypes.factory) && !isRepair(data));
	}

	// магазин?
	function isShop(data)
	{
		return ((data.object.common.type == data.dataObjectsTypes.shop) && !isRepair(data));
	}

	// учебное заведение?
	function isSchool(data)
	{
		return ((data.object.common.type == data.dataObjectsTypes.school) && !isRepair(data));
	}
		
	// частная собственность? сюда же попадает чудо, но пока это неважно (!!!)
	function isHouse(data)
	{
		return ((data.object.common.type == data.dataObjectsTypes.house) && !isRepair(data));
	}
	
	// =================================================================================================
	// функции для заполнения полей (продукция / ресурсы)

	// кол-во ресурсов, необходимое на заполнение склада
	function getCountDiff(data,itemTableType,type)
	{
		var count;
		count = parseFloat(data.object.items[itemTableType][type].limit,10) - parseFloat(data.object.items[itemTableType][type].count,10);
		return count;
	}

	// сумма, необходимая на заполнение склада
	function getPriceDiff(data,itemTableType,type)
	{
		var price;
		price = parseFloat(data.object.items[itemTableType][type].countDiff,10) * parseFloat(data.object.items[itemTableType][type].price,10);
		if (0 > price) {
			price = 0;
		}
		return price;
	}

	// кол-во ресурсов, необходимое на заполнение склада (округл. вверх)
	function getCountDiffCeil(data,itemTableType,type)
	{
		var count = Math.ceil(data.object.items[itemTableType][type].countDiff);
		return count;
	}

	// сумма, необходимая на заполнение склада (округл. вверх)
	function getPriceDiffCeil(data,itemTableType,type)
	{
		var price;
		price = Math.ceil( (   parseFloat(data.object.items[itemTableType][type].countDiffCeil,10) * parseFloat(data.object.items[itemTableType][type].price,10)   ) );
		if (0 > price) {
			price = 0;
		}
		return price;
	}

	// кол-во ресурса, необходимое до окончания ремонта (точно)
	function getCountDiffRepair(data,itemTableType,type)
	{
		var count = 0;
		if ('resources' == itemTableType)
		{
			count = parseFloat(data.object.common.hours,10) * parseFloat(data.object.items[itemTableType][type].norm,10);
		}
		return count;
	}
	
	// кол-во ресурса, необходимое до окончания ремонта (вверх)
	function getCountDiffRepairCeil(data,itemTableType,type)
	{
		var count = 0;
		if ('resources' == itemTableType)
		{
			count = Math.ceil((parseFloat(data.object.common.hours,10) * parseFloat(data.object.items[itemTableType][type].norm,10)));
		}
		return count;
	}

	// сумма, необходимая на заполнение склада до окончания ремонта (точно)
	function getPriceDiffRepair(data,itemTableType,type)
	{
		var price = 0;
		if ('resources' == itemTableType)
		{
			price = (   parseFloat(data.object.items[itemTableType][type].countDiffRepair,10) * parseFloat(data.object.items[itemTableType][type].price,10)   ) ;
			if (0 > price) {
				price = 0;
			}
		}
		return price;
	}
	
	// сумма, необходимая на заполнение склада до окончания ремонта (вверх)
	function getPriceDiffRepairCeil(data,itemTableType,type)
	{
		var price = 0;
		if ('resources' == itemTableType)
		{
			price = Math.ceil( (   parseFloat(data.object.items[itemTableType][type].countDiffRepairCeil,10) * parseFloat(data.object.items[itemTableType][type].price,10)   ) );
			if (0 > price) {
				price = 0;
			}
		}
		return price;
	}

	// расход ресурса при строительстве
	function getItemNorm(data, type, itemTableType)
	{
		var norm = 0;
		if ('resources' == itemTableType)
		{
			if (isRepair(data)) // расход по стройке
			{
				norm = getRepairNorm(data, type, itemTableType);
			}
			else // расход по не стройке
			{
				norm = getOtherNorm(data, type, itemTableType);
			}
		}
		return norm;
	}

	function getPriceOne(data,itemTableType,type)
	{
		var price = data.object.items[itemTableType][type].price * data.object.items[itemTableType][type].norm;
		return price;
	}
	
	// не хватает на ремонт
	function getCountDiffRepairNeed(data,itemTableType,type)
	{
		var count = 0;
		if ('resources' == itemTableType)
		{
			count = Math.ceil((parseFloat(data.object.common.hours,10) * parseFloat(data.object.items[itemTableType][type].norm,10) - parseFloat(data.object.items[itemTableType][type].count,10)));
			if (count < 0){
				count = 0;
			}
		}
		return count;
	}
	
	// сумма, необходимая на заполнение склада до окончания ремонта
	function getPriceDiffRepairNeed(data,itemTableType,type)
	{
		var price = 0;
		if ('resources' == itemTableType)
		{
			price = Math.ceil( (   parseFloat(data.object.items[itemTableType][type].countDiffRepairNeed,10) * parseFloat(data.object.items[itemTableType][type].price,10)   ) );
			if (0 > price) {
				price = 0;
			}
		}
		return price;
	}
	
	// ресурсы сверх лимита
	function getOverLimit(data,itemTableType,type)
	{
		var count = (data.object.items[itemTableType][type].count - data.object.items[itemTableType][type].limit);
		if (count < 0){
			count = 0;
		}
		return count;
	}
	
	// =================================================================================================
	// рассчетные функции для ресурсов/предметов

	// норма потребления для стройки
	function getRepairNorm(data, type, itemTableType)
	{
		var norm = 0;
		for(var key in data.dataResources)
		{

			if (data.dataResources[key].id == type) {
				norm = data.dataResources[key].repairNorm;
				break;
			}
		}
		return norm;
	}

	// норма потребления для не стройки
	function getOtherNorm(data, type, itemTableType)
	{ 
		var norm = 0;
		for(var key in data.dataNorms[data.object.common.id])
		{
			if (data.dataResources[key] && data.dataResources[key].id == type) {
				norm = data.dataNorms[data.object.common.id][key];
				break;
			}
		}
		return norm;
	}

	// получить данные продукции/ресурсов
	function calcItemValues(data)
	{
		var tBody, span, itemType, spanHTML;
		var table = data.root.document.getElementsByClassName('table-form');

		for (var i = 0; i <  table.length; i++) 
		{
			tBody = table[i].getElementsByTagName('tbody');
			span = tBody[0].getElementsByTagName('span');
			itemTableType = getItemTableType(i, data); // добавлять к ресурсам (или к продукции)?

			for (var j = 0; j < span.length; j++) 
			{
				spanHTML = span[j].innerHTML;

				// покупка приостановлена или не хватает ресурсов (тоже дают спаны) - пропустить
				if ('Покупка приостановлена' == spanHTML || 'attn' ==  span[j].className)
				{
					if ('Покупка приостановлена' == spanHTML)
					{
						data.object.items[itemTableType][data.object.info.addition.currentItemType].open = false;
					}
					data.object.info.addition.correctSpan++;
					continue;
				}

				setItemsValues(data, span[j], itemTableType, j);
			}
		}
	}

	// просматриваем таблицу ресурсов или продукции?	
	// магазин: п р
	// первичные: п
	// вторичные: п р
	// стройка: р
	// школа: р или -
	// ч.с: - 
	function getItemTableType(i, data)
	{
		var type;

		if (0 == i)
		{
			// 1я таблица для стройки или школы - р
			if (isRepair(data) || data.object.common.type == data.dataObjectsTypes.school)
			{
				 type = 'resources';
			}
			// 1я таблица для магазина или производства - п
			else
			{
				 type = 'products';
			}
		}
		else
		{
			// 2я таблица есть только у магазина или производства, она всегда р
			type = 'resources';
		}

		return type;
	}

	// установить данные по ресурсам/продукции
	function setItemsValues(data, span, itemTableType, i)
	{
		var mod = (i - data.object.info.addition.correctSpan) % 3; // спаны идут по 3, лишние корректируются переменной data.object.info.addition.correctSpan
		var spanHTML = span.innerHTML;
		var type, name, matchArr, a;

		switch (mod)
		{
			case 0: // здесь название

				a = span.getElementsByTagName('a');
				if (0 < a.length){
					data.object.info.addition.currentItemType = a[0].href.match(data.object.info.addition.onlyFloal);
					name = a[0].innerHTML;
				}
				else{
					data.object.info.addition.currentItemType = new Date().getTime();
					name = spanHTML;
				}
				type = data.object.info.addition.currentItemType;

				data.object.items[itemTableType][type] = {};
				data.object.items[itemTableType][type].type = type;
				data.object.items[itemTableType][type].name = name.trim();
				data.object.items[itemTableType][type].open = true;
				data.object.items[itemTableType][type].norm = getItemNorm(data, type,itemTableType);

				break 
				
			case 1: // здесь кол-во и лимиты

				matchArr =  spanHTML.match(data.object.info.addition.onlyFloal);
				type = data.object.info.addition.currentItemType;

				data.object.items[itemTableType][type].limit = matchArr[1];
				data.object.items[itemTableType][type].maxLimit = matchArr[(matchArr.length - 1)];
				data.object.items[itemTableType][type].count = matchArr[0];
				data.object.items[itemTableType][type].countDiff = getCountDiff(data,itemTableType,type);
				data.object.items[itemTableType][type].countDiffCeil = getCountDiffCeil(data,itemTableType,type);
				data.object.items[itemTableType][type].countDiffRepair	= getCountDiffRepair(data,itemTableType,type);
				data.object.items[itemTableType][type].countDiffRepairCeil	= getCountDiffRepairCeil(data,itemTableType,type);
				data.object.items[itemTableType][type].countDiffRepairNeed = getCountDiffRepairNeed(data,itemTableType,type);
				data.object.items[itemTableType][type].overLimit = getOverLimit(data,itemTableType,type);

				break 

			case 2: // здесь цена

				matchArr =  spanHTML.match(data.object.info.addition.onlyFloal);
				type = data.object.info.addition.currentItemType;

				data.object.items[itemTableType][type].price = matchArr[0];
				data.object.items[itemTableType][type].priceDiff = getPriceDiff(data,itemTableType,type);
				data.object.items[itemTableType][type].priceDiffCeil = getPriceDiffCeil(data,itemTableType,type);
				data.object.items[itemTableType][type].priceDiffRepair = getPriceDiffRepair(data,itemTableType,type);
				data.object.items[itemTableType][type].priceDiffRepairCeil = getPriceDiffRepairCeil(data,itemTableType,type);
				data.object.items[itemTableType][type].priceDiffRepairNeed = getPriceDiffRepairNeed(data,itemTableType,type);
				data.object.items[itemTableType][type].priceOne = getPriceOne(data,itemTableType,type);

				/*
				alert(itemTableType+': \n'
					+'type					'+data.object.items[itemTableType][type].type+'\n'
					+'name					'+data.object.items[itemTableType][type].name+' \n'
					+'open					'+data.object.items[itemTableType][type].open+' (всегда true) \n'
					+'norm					'+data.object.items[itemTableType][type].norm+' \n'
					+'limit					'+data.object.items[itemTableType][type].limit+' \n'
					+'maxLimit				'+data.object.items[itemTableType][type].maxLimit+' \n'
					+'count					'+data.object.items[itemTableType][type].count+' \n'
					+'countDiff				'+data.object.items[itemTableType][type].countDiff+' \n'
					+'countDiffCeil			'+data.object.items[itemTableType][type].countDiffCeil+' \n'
					+'countDiffRepairCeil	'+data.object.items[itemTableType][type].countDiffRepairCeil+' \n'
					+'price					'+data.object.items[itemTableType][type].price+' \n'
					+'priceDiff				'+data.object.items[itemTableType][type].priceDiff+' \n'
					+'priceDiffCeil			'+data.object.items[itemTableType][type].priceDiffCeil+' \n'
					+'priceDiffRepairCeil	'+data.object.items[itemTableType][type].priceDiffRepairCeil+' \n'
					+'priceOne				'+data.object.items[itemTableType][type].priceOne+' \n'
				);
				//*/

				break 
		}
	}

	// =================================================================================================
	// расход/прибыль на 1 нч ремонта/ед продукции

	// расход/прибыль на 1 нч ремонта/ед продукции
	function getRateOne(data)
	{
		var rate = 0;

		// по ресурсам
		for(var key in data.object.items.resources)
		{
			if (isRepair(data) || isFactory(data)) // расход/прибыль по ресурсам (стройка/производство)
			{
				rate = parseFloat(rate,10) + parseFloat( data.object.items.resources[key].norm,10) * parseFloat(data.object.items.resources[key].price,10);
			}	
		}

		// по з/п
		if (isRepair(data) || isFactory(data))
		{
			rate = parseFloat(rate,10) +  parseFloat(data.object.common.payCount ,10)* parseFloat(data.object.common.pay,10);
		}

		return rate;
	}

	// прибыль за 1 ед
	function getProfitItem(data)
	{
		var profit = 0;
		if (isFactory(data) && data.dataNorms[data.object.common.id]) // производство, только если есть настройки
		{
			for(var key in data.object.items.products)
			{
				profit = parseFloat(data.object.items.products[key].price) - parseFloat(data.object.common.rateOne); // !!! если на кх появятся производства, где больше 1 вида продукции, скрипт всё равно переделывать, т.ч. оставлю так :)
			}
		}
		return profit;
	}
 
	// прибыль за 1 нч
	function getProfitHour(data)
	{
		var profit = 0;
		var payCount = parseFloat(data.object.common.payCount,10);

		if (payCount)	{
			 profit = parseFloat(data.object.common.profitItem,10) / payCount;
		}

		return profit;
	}

	// прибыль за всё свободное место
	function getProfitFullDiff(data)
	{
		var profit = 0;
		
		for(var key in data.object.items.products)
		{
			profit = data.object.common.profitItem * (parseFloat(data.object.items.products[key].limit) - parseFloat(data.object.items.products[key].count)); // !!! если на кх появятся производства, где больше 1 вида продукции, скрипт всё равно переделывать, т.ч. оставлю так :)
		}

		return profit;
	}
 
	// =================================================================================================
	// расчеты по балансу

	// рекомендованный баланс
	function calcRecommendedMoney(data)
	{
		var money = 0;

		if( isRepair(data))	{
			money = calcRecommendedMoneyRepair(data);
		}
		else if(isFactory(data)){
			money = calcRecommendedMoneyFactory(data);
		}
		else if(isShop(data)){
			money = calcRecommendedMoneyShop(data);
		}
		else{
			money = 0;
		}

		// сбережения на счете
		if (data.dataNorms[data.object.common.id] && data.dataNorms[data.object.common.id].moneyAddition) {
			money += data.dataNorms[data.object.common.id].moneyAddition;
		}
			
		return Math.ceil(money);
	}
	
	// рекомендованный баланс для магазина
	function calcRecommendedMoneyShop(data)
	{
		var money;
		money = data.object.common.moneyToResources;
		return money;
	}

	// рекомендованный баланс для производства
	function calcRecommendedMoneyFactory(data)
	{
		var money;
		money =  parseFloat(data.object.common.moneyToResources,10) +  parseFloat(data.object.common.moneyToProducts,10);
		return money;
	}

	// рекомендованный баланс для стройки
	function calcRecommendedMoneyRepair(data)
	{
		var money;
		money = parseFloat(data.object.common.moneyToResources,10) 
				+ parseFloat(data.object.common.moneyToResourcesRepair,10)
				+ parseFloat(data.object.common.moneyToPay,10)
				+ parseFloat(data.object.common.moneyToAddition,10)
		;
		return money;
	}

	// нужно денег, чтобы заполнить склад ресурсов (точно)
	function calcMoneyToResources(data)
	{
		var money = 0;
		
		for(var key in data.object.items.resources)
		{
			money = parseFloat(money,10) + parseFloat(data.object.items.resources[key].priceDiff,10);
		}

		return money;
	}

	// нужно денег, чтобы заполнить склад продукции (точно)
	function calcMoneyToProducts(data)
	{
		var money = 0;
		
		// на остаток продукции до полного склада "с нуля"
		for(var key in data.object.items.products)
		{
			money = parseFloat(money,10) + (parseFloat(data.object.items.products[key].priceDiff,10) -  parseFloat(data.object.common.profitFullDiff ,10));
		}
		
		// учесть ресурсы, которые уже есть сверх лимита
		for(var key in data.object.items.resources)
		{
			money = parseFloat(money,10) - (parseFloat(data.object.items.resources[key].overLimit,10) * parseFloat(data.object.items.resources[key].price,10));
		}

		return money;
	}

	// нужно денег на з/п (точно)
	function calcMoneyToPay(data)
	{
		var money = 0;
		money = Math.ceil((parseFloat(data.object.common.pay,10) * parseFloat(data.object.common.hours,10)));
		return money;
	}

	// нужно денег на ресурсы на весь ремонт, без з/п (точно)
	function calcMoneyToResourcesRepair(data)
	{
		var money = 0;
		
		for(var key in data.object.items.resources)
		{
			money = parseFloat(money,10) + parseFloat(data.object.items.resources[key].priceDiffRepair,10) - parseFloat(data.object.items.resources[key].overLimit, 10);
		}

		return money;
	}

	// запас (1 устройство с па с максимальным производом)
	function calcMoneyToAddition(data)
	{
		var money = 0;

		if( isRepair(data))	{
			money = parseFloat(data.object.info.addition.maxCoefficientProduction,10) * parseFloat(data.object.common.rateOne,10);
		}

		return money;
	}

	// не хватает в сумме на ресурсы на ремонт
	function calcMoneyToResourcesNeed(data)
	{
		var money = 0;
		
		for(var key in data.object.items.resources)
		{
			money = parseFloat(money,10) + parseFloat(data.object.items.resources[key].priceDiffRepairNeed,10);
		}

		return money;
	}
	
	// на счете не хватает
	function calcMissingMoney(data)
	{
		var money = 0;
		if ( isRepair(data) || isFactory(data) || isShop(data) || isHouse(data)) {
			money = (Math.ceil(data.object.common.recommendedMoney) - Math.floor(data.object.common.money));
		}
		return money;
	}

	// =================================================================================================
	// аякс
	
	// получение данных аяксом, (с)тырено у некого W_or_M, за что ему спасибо :)
	function ajax(url, method, onload) {
	    
	    // только FF. Maxthon лесом.
	    if (typeof GM_xmlhttpRequest != 'undefined'  && typeof document.all == 'undefined') {
	        
	        GM_xmlhttpRequest({
	            
	            method: method,
	            url: url,
	            onload: onload
	            
	        });
	    // все остальное через Prototype
	    } else if (typeof Ajax != 'undefined') {
	        
	        new Ajax.Request(url, {
	            
	            method: method,
	            onComplete: onload
	            
	        });
	    // ожидаем загрузки библиотеки        
	    } else if (root.document.getElementById('fwprototype') == null) {
	        
	        var script = root.document.createElement('script');
	        script.id   = 'fwprototype';
	        script.type = 'text/javascript';
	        //script.src  = 'http://ajax.googleapis.com/ajax/libs/jquery/1.2.6/jquery.min.js';
	        script.src = 'http://www.prototypejs.org/assets/2007/1/18/prototype.js';
	        root.document.body.appendChild(script);
	        
	        root.setTimeout(function() { ajax(url, method, onload); }, 100);
	        
	    } else {
	        
	        root.setTimeout(function() { ajax(url, method, onload); }, 100);
	        
	    }
	}

	// дата последней продажи
	function getAjaxResourcesLastDate()
	{
		var url = 'http://cathome.ru/object-resource-buying-log.php?id='+data.object.common.id;
		
		ajax(url, 'GET', function(pageObj) 
		{
			document.getElementById('ajax-resources-last-date').innerHTML = getLastDataForText(pageObj);
		});
	}
	
	// дата последней покупки
	function getAjaxProductsLastDate()
	{
		var url = 'http://cathome.ru/object-production-selling-log.php?id='+data.object.common.id;
		
		ajax(url, 'GET', function(pageObj) 
		{
			document.getElementById('ajax-products-last-date').innerHTML = getLastDataForText(pageObj);
		});
	}	
	
	// дата последнего устройства
	function getAjaxWorkLastDate()
	{
		var url = 'http://cathome.ru/object-workers-log.php?id='+data.object.common.id;
		
		ajax(url, 'GET', function(pageObj) 
		{
			document.getElementById('ajax-work-last-date').innerHTML = getLastDataForText(pageObj);
		});
	}
	
	// процент износа
	function getAjaxPercent()
	{
		var url = 'http://cathome.ru/object-management.php?id='+data.object.common.id;
		
		ajax(url, 'GET', function(pageObj) 
		{
			var tableHTML = pageObj.responseText;
			var percent = 'неизвестно';
			var arr1 = tableHTML.split('infographic-table');
			
			if (arr1[1])
			{
				var arr2 = arr1[1].split('Изношенность');
				if (arr2[1])
				{
					var arr3 = arr2[1].split('Баланс');
					var percent = arr3[0].match(/\d{1,2}.\d{1,2}/g);
				}
			}
			
			document.getElementById('ajax-percent').innerHTML = percent+' %';
		});
	}
		
	// последняя дата устройства/покупки/продажи
	function getLastDataForText(pageObj) 
	{
		var pageText = pageObj.responseText;
		var dateArr1  = pageText.split('<ul class="logs">');
		var lastData = 'неизвестно';
		
		if (dateArr1[1])
		{
			var dateArr2  = dateArr1[1].split('date');
			
			if (dateArr2[1])
			{
				lastData = dateArr2[1].match(/\d{2}.\d{2}.\d{4} \d{2}:\d{2}/g)[0];
			}
		}
		
		return lastData;
	}

	// =================================================================================================
	// звуки

	// проиграть звук
	function playAudio(audioUrl)
	{
		if (audioUrl)
		{
			var audio = new Audio();
			audio.preload = 'auto';
			audio.src = audioUrl;
			audio.play();
		}
	}
	
	// уведомление об окончании работы
	function endOfWork(audioUrl, root)
	{
		if (audioUrl)
		{
			var checkSecReload = 180*1000;
			var checkSecSound = checkSecReload - 60*1000;
			
			// начать проигрывать звук за минуту до обновления стр.
			setTimeout(function()
			{
				var url = 'http://cathome.ru/home.php';		
	
				ajax(url, 'GET', function(pageObj) 
				{
					var tableHTML = pageObj.responseText;
					var arr1 = tableHTML.split('Осталось работать');
					
					if (1 < arr1.length) // еще работает 
					{
						;
					}
					else // кот доработал или разлогинился
					{
						playAudio(audioUrl);
					}
				});
			}, checkSecSound);
			
			// обновить стр. через 3 минуты
			setTimeout(function()
			{
				window.location.reload(true); // обновить (важно для мозиллы)			
			}, checkSecReload);
		}
	}
	
}
	
)();