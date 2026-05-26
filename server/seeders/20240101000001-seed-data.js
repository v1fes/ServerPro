'use strict';
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const hash = (pw) => bcrypt.hashSync(pw, 12);

const brands = {
  phone: [
    { brand: 'Apple', models: ['iPhone 13', 'iPhone 14', 'iPhone 15', 'iPhone 12', 'iPhone 11'] },
    { brand: 'Samsung', models: ['Galaxy S23', 'Galaxy S22', 'Galaxy A54', 'Galaxy S21', 'Galaxy A34'] },
    { brand: 'Xiaomi', models: ['Redmi Note 12', 'Poco X5', 'Mi 13', 'Redmi Note 11', 'Poco F5'] },
  ],
  laptop: [
    { brand: 'Apple', models: ['MacBook Air M2', 'MacBook Pro 14', 'MacBook Air M1'] },
    { brand: 'Lenovo', models: ['ThinkPad X1 Carbon', 'IdeaPad 5', 'Legion 5'] },
    { brand: 'HP', models: ['Pavilion 15', 'EliteBook 840', 'Omen 16'] },
    { brand: 'Dell', models: ['XPS 13', 'Inspiron 15', 'Latitude 5530'] },
    { brand: 'ASUS', models: ['ZenBook 14', 'ROG Strix G15', 'VivoBook 15'] },
  ],
  tablet: [
    { brand: 'Apple', models: ['iPad Air 5', 'iPad Pro 11', 'iPad 10'] },
    { brand: 'Samsung', models: ['Galaxy Tab S9', 'Galaxy Tab A8', 'Galaxy Tab S8'] },
    { brand: 'Lenovo', models: ['Tab P11', 'Tab M10'] },
  ],
};

const repairTypesList = [
  { name: 'Заміна екрану', description: 'Заміна дисплейного модуля' },
  { name: 'Заміна батареї', description: 'Заміна акумулятора' },
  { name: 'Заміна роз\'єму зарядки', description: 'Ремонт або заміна порту зарядки' },
  { name: 'Ремонт материнської плати', description: 'Діагностика та пайка компонентів' },
  { name: 'Заміна камери', description: 'Заміна основної або фронтальної камери' },
  { name: 'Заміна клавіатури', description: 'Заміна клавіатурного модуля (ноутбук)' },
  { name: 'Чистка від пилу', description: 'Профілактична чистка та заміна термопасти' },
  { name: 'Заміна динаміка', description: 'Заміна розмовного або поліфонічного динаміка' },
  { name: 'Відновлення даних', description: 'Відновлення інформації з пошкодженого носія' },
  { name: 'Заміна SSD/HDD', description: 'Заміна накопичувача даних' },
  { name: 'Ремонт після залиття', description: 'Чистка та ремонт після потрапляння рідини' },
  { name: 'Заміна тачскрину', description: 'Заміна сенсорного скла' },
  { name: 'Оновлення ПЗ', description: 'Перепрошивка або оновлення операційної системи' },
  { name: 'Заміна мікрофону', description: 'Заміна мікрофонного модуля' },
];

const partsList = [
  { name: 'Екран iPhone 14', category: 'Екрани', compatibleDeviceType: 'phone', compatibleBrand: 'Apple', compatibleModel: 'iPhone 14', price: 4500, quantityInStock: 8, minStockLevel: 3 },
  { name: 'Екран iPhone 13', category: 'Екрани', compatibleDeviceType: 'phone', compatibleBrand: 'Apple', compatibleModel: 'iPhone 13', price: 3800, quantityInStock: 10, minStockLevel: 3 },
  { name: 'Екран Samsung Galaxy S23', category: 'Екрани', compatibleDeviceType: 'phone', compatibleBrand: 'Samsung', compatibleModel: 'Galaxy S23', price: 5200, quantityInStock: 5, minStockLevel: 2 },
  { name: 'Екран Samsung Galaxy A54', category: 'Екрани', compatibleDeviceType: 'phone', compatibleBrand: 'Samsung', compatibleModel: 'Galaxy A54', price: 2800, quantityInStock: 7, minStockLevel: 3 },
  { name: 'Екран Xiaomi Redmi Note 12', category: 'Екрани', compatibleDeviceType: 'phone', compatibleBrand: 'Xiaomi', compatibleModel: 'Redmi Note 12', price: 1800, quantityInStock: 12, minStockLevel: 5 },
  { name: 'Батарея iPhone 14', category: 'Батареї', compatibleDeviceType: 'phone', compatibleBrand: 'Apple', compatibleModel: 'iPhone 14', price: 1200, quantityInStock: 15, minStockLevel: 5 },
  { name: 'Батарея iPhone 13', category: 'Батареї', compatibleDeviceType: 'phone', compatibleBrand: 'Apple', compatibleModel: 'iPhone 13', price: 1000, quantityInStock: 18, minStockLevel: 5 },
  { name: 'Батарея Samsung Galaxy S23', category: 'Батареї', compatibleDeviceType: 'phone', compatibleBrand: 'Samsung', compatibleModel: 'Galaxy S23', price: 1100, quantityInStock: 10, minStockLevel: 3 },
  { name: 'Роз\'єм Type-C універсальний', category: 'Роз\'єми', compatibleDeviceType: 'phone', compatibleBrand: null, compatibleModel: null, price: 350, quantityInStock: 30, minStockLevel: 10 },
  { name: 'Роз\'єм Lightning iPhone', category: 'Роз\'єми', compatibleDeviceType: 'phone', compatibleBrand: 'Apple', compatibleModel: null, price: 550, quantityInStock: 20, minStockLevel: 5 },
  { name: 'Термопаста Arctic MX-4', category: 'Витратні матеріали', compatibleDeviceType: 'laptop', compatibleBrand: null, compatibleModel: null, price: 250, quantityInStock: 25, minStockLevel: 10 },
  { name: 'SSD 256GB NVMe', category: 'Накопичувачі', compatibleDeviceType: 'laptop', compatibleBrand: null, compatibleModel: null, price: 1500, quantityInStock: 8, minStockLevel: 3 },
  { name: 'SSD 512GB NVMe', category: 'Накопичувачі', compatibleDeviceType: 'laptop', compatibleBrand: null, compatibleModel: null, price: 2200, quantityInStock: 6, minStockLevel: 2 },
  { name: 'Клавіатура Lenovo ThinkPad', category: 'Клавіатури', compatibleDeviceType: 'laptop', compatibleBrand: 'Lenovo', compatibleModel: null, price: 1800, quantityInStock: 4, minStockLevel: 2 },
  { name: 'Батарея MacBook Air M2', category: 'Батареї', compatibleDeviceType: 'laptop', compatibleBrand: 'Apple', compatibleModel: 'MacBook Air M2', price: 3500, quantityInStock: 3, minStockLevel: 2 },
  { name: 'Екран iPad Air 5', category: 'Екрани', compatibleDeviceType: 'tablet', compatibleBrand: 'Apple', compatibleModel: 'iPad Air 5', price: 5500, quantityInStock: 2, minStockLevel: 1 },
  { name: 'Камера основна iPhone 14', category: 'Камери', compatibleDeviceType: 'phone', compatibleBrand: 'Apple', compatibleModel: 'iPhone 14', price: 2800, quantityInStock: 5, minStockLevel: 2 },
  { name: 'Динамік розмовний Samsung', category: 'Динаміки', compatibleDeviceType: 'phone', compatibleBrand: 'Samsung', compatibleModel: null, price: 400, quantityInStock: 15, minStockLevel: 5 },
];

const descriptions = [
  'Не вмикається після падіння',
  'Розбитий екран, сенсор працює частково',
  'Швидко розряджається батарея',
  'Не заряджається від кабелю',
  'Перегрівається при роботі',
  'Не працює камера',
  'Тріщина на екрані після удару',
  'Зависає та перезавантажується самостійно',
  'Не працює Wi-Fi модуль',
  'Потрапила вода, не працюють кнопки',
  'Немає звуку при дзвінках',
  'Повільно працює, зависає',
  'Клавіатура не реагує на натискання',
  'Шум вентилятора та перегрів',
  'Не визначає SIM-карту',
  'Екран блимає та мерехтить',
  'Мікрофон не працює під час дзвінків',
  'Тачскрін не реагує в нижній частині',
];

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randEl = (arr) => arr[Math.floor(Math.random() * arr.length)];
const statuses = ['new', 'diagnostics', 'in_progress', 'waiting_parts', 'ready', 'issued'];

module.exports = {
  async up(queryInterface) {
    // --- USERS ---
    const users = [
      { email: 'admin@service.com', password_hash: hash('admin123'), role: 'admin', first_name: 'Олександр', last_name: 'Петренко', phone: '+380501234567', specialization: null, is_active: true, created_at: new Date('2024-01-01'), updated_at: new Date() },
      { email: 'master1@service.com', password_hash: hash('master123'), role: 'master', first_name: 'Іван', last_name: 'Коваленко', phone: '+380671112233', specialization: 'Телефони Apple/Samsung', is_active: true, created_at: new Date('2024-01-15'), updated_at: new Date() },
      { email: 'master2@service.com', password_hash: hash('master123'), role: 'master', first_name: 'Дмитро', last_name: 'Шевченко', phone: '+380672223344', specialization: 'Ноутбуки та планшети', is_active: true, created_at: new Date('2024-02-01'), updated_at: new Date() },
      { email: 'master3@service.com', password_hash: hash('master123'), role: 'master', first_name: 'Андрій', last_name: 'Бондаренко', phone: '+380673334455', specialization: 'Материнські плати, пайка', is_active: true, created_at: new Date('2024-03-01'), updated_at: new Date() },
    ];

    // Generate 15 clients
    const clientNames = [
      ['Марія', 'Ткаченко'], ['Олена', 'Гриценко'], ['Тетяна', 'Мельник'],
      ['Наталія', 'Лисенко'], ['Вікторія', 'Кравченко'], ['Юлія', 'Олійник'],
      ['Сергій', 'Мороз'], ['Микола', 'Савченко'], ['Павло', 'Руденко'],
      ['Артем', 'Ткачук'], ['Максим', 'Козлов'], ['Віталій', 'Бойко'],
      ['Анна', 'Поліщук'], ['Катерина', 'Марченко'], ['Ірина', 'Левченко'],
    ];

    clientNames.forEach(([fn, ln], i) => {
      users.push({
        email: `client${i + 1}@test.com`,
        password_hash: hash('client123'),
        role: 'client',
        first_name: fn,
        last_name: ln,
        phone: `+38067${String(1000000 + i * 111111).slice(0, 7)}`,
        specialization: null,
        is_active: true,
        created_at: new Date(2024, randInt(0, 11), randInt(1, 28)),
        updated_at: new Date(),
      });
    });

    await queryInterface.bulkInsert('users', users);

    // --- REPAIR TYPES ---
    const repairTypesData = repairTypesList.map((rt) => ({
      ...rt,
      created_at: new Date('2024-01-01'),
      updated_at: new Date(),
    }));
    await queryInterface.bulkInsert('repair_types', repairTypesData);

    // --- PARTS ---
    const partsData = partsList.map((p) => ({
      name: p.name,
      category: p.category,
      compatible_device_type: p.compatibleDeviceType,
      compatible_brand: p.compatibleBrand,
      compatible_model: p.compatibleModel,
      price: p.price,
      quantity_in_stock: p.quantityInStock,
      min_stock_level: p.minStockLevel,
      created_at: new Date('2024-01-01'),
      updated_at: new Date(),
    }));
    await queryInterface.bulkInsert('parts', partsData);

    // --- DEVICES --- (2-4 devices per client)
    const devicesList = [];
    const clientStartId = 5; // first client id (after admin + 3 masters)
    for (let clientIdx = 0; clientIdx < 15; clientIdx++) {
      const clientId = clientStartId + clientIdx;
      const numDevices = randInt(1, 3);
      for (let d = 0; d < numDevices; d++) {
        const deviceType = randEl(['phone', 'laptop', 'tablet']);
        const brandInfo = randEl(brands[deviceType]);
        const model = randEl(brandInfo.models);
        devicesList.push({
          client_id: clientId,
          device_type: deviceType,
          brand: brandInfo.brand,
          model: model,
          serial_number: `SN${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
          purchase_date: new Date(randInt(2020, 2025), randInt(0, 11), randInt(1, 28)),
          created_at: new Date(2024, randInt(0, 5), randInt(1, 28)),
          updated_at: new Date(),
        });
      }
    }
    await queryInterface.bulkInsert('devices', devicesList);

    // --- REPAIR ORDERS --- (generate 60+ orders across different dates)
    const ordersList = [];
    const statusHistoryList = [];
    const orderPartsList = [];
    const orderRepairsList = [];
    const masterIds = [2, 3, 4];

    let orderCounter = 0;
    for (let i = 0; i < devicesList.length; i++) {
      const numOrders = randInt(1, 4);
      for (let j = 0; j < numOrders; j++) {
        orderCounter++;
        const createdDate = new Date(2024, randInt(0, 11), randInt(1, 28));
        const status = randEl(statuses);
        const masterId = randEl(masterIds);
        const orderNumber = `SR${createdDate.getFullYear().toString().slice(-2)}${String(createdDate.getMonth() + 1).padStart(2, '0')}-${String(orderCounter).padStart(4, '0')}`;

        const isCompleted = status === 'ready' || status === 'issued';
        const completedDate = isCompleted ? new Date(createdDate.getTime() + randInt(1, 14) * 86400000) : null;
        const cost = isCompleted ? randInt(300, 8000) : (status === 'in_progress' ? randInt(200, 5000) : 0);

        ordersList.push({
          order_number: orderNumber,
          device_id: i + 1,
          client_id: devicesList[i].client_id,
          master_id: status === 'new' ? null : masterId,
          status,
          description: randEl(descriptions),
          diagnosis: status !== 'new' ? 'Проведено діагностику. ' + randEl(['Потрібна заміна компонента', 'Програмна проблема', 'Фізичне пошкодження', 'Знос батареї']) : null,
          total_cost: cost,
          deadline: new Date(createdDate.getTime() + 7 * 86400000),
          completed_at: completedDate,
          photo_url: null,
          created_at: createdDate,
          updated_at: completedDate || new Date(),
        });

        // Status history
        statusHistoryList.push({
          order_id: orderCounter,
          status: 'new',
          changed_by: devicesList[i].client_id,
          comment: 'Заявку створено',
          created_at: createdDate,
        });

        const statusFlow = statuses.slice(0, statuses.indexOf(status) + 1);
        for (let si = 1; si < statusFlow.length; si++) {
          statusHistoryList.push({
            order_id: orderCounter,
            status: statusFlow[si],
            changed_by: masterId,
            comment: null,
            created_at: new Date(createdDate.getTime() + si * randInt(1, 3) * 86400000),
          });
        }

        // Order repairs
        if (status !== 'new') {
          const numRepairs = randInt(1, 2);
          for (let r = 0; r < numRepairs; r++) {
            orderRepairsList.push({
              order_id: orderCounter,
              repair_type_id: randInt(1, repairTypesList.length),
              cost: randInt(200, 3000),
              created_at: new Date(createdDate.getTime() + 2 * 86400000),
            });
          }
        }

        // Order parts (for in_progress+ orders)
        if (['in_progress', 'waiting_parts', 'ready', 'issued'].includes(status)) {
          const numParts = randInt(1, 2);
          for (let p = 0; p < numParts; p++) {
            const partId = randInt(1, partsList.length);
            orderPartsList.push({
              order_id: orderCounter,
              part_id: partId,
              quantity: 1,
              price_at_use: partsList[partId - 1].price,
              created_at: new Date(createdDate.getTime() + 3 * 86400000),
            });
          }
        }
      }
    }

    await queryInterface.bulkInsert('repair_orders', ordersList);
    await queryInterface.bulkInsert('order_status_history', statusHistoryList);
    if (orderRepairsList.length > 0) {
      await queryInterface.bulkInsert('order_repairs', orderRepairsList);
    }
    if (orderPartsList.length > 0) {
      await queryInterface.bulkInsert('order_parts', orderPartsList);
    }

    // --- NOTIFICATIONS ---
    const notificationsList = [];
    for (let i = 0; i < 20; i++) {
      const clientId = randInt(clientStartId, clientStartId + 14);
      notificationsList.push({
        user_id: clientId,
        title: randEl(['Зміна статусу заявки', 'Ремонт завершено', 'Потрібна інформація']),
        message: randEl([
          'Статус вашої заявки змінено на "В роботі"',
          'Ремонт вашого пристрою завершено, можете забрати',
          'Потрібне ваше підтвердження на заміну запчастини',
          'Діагностику проведено, очікуйте на дзвінок',
        ]),
        is_read: Math.random() > 0.5,
        created_at: new Date(2024, randInt(0, 11), randInt(1, 28)),
      });
    }
    await queryInterface.bulkInsert('notifications', notificationsList);

    console.log(`Seeded: ${users.length} users, ${devicesList.length} devices, ${ordersList.length} orders, ${partsList.length} parts`);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('notifications', null, {});
    await queryInterface.bulkDelete('predictions', null, {});
    await queryInterface.bulkDelete('order_repairs', null, {});
    await queryInterface.bulkDelete('order_parts', null, {});
    await queryInterface.bulkDelete('order_status_history', null, {});
    await queryInterface.bulkDelete('repair_orders', null, {});
    await queryInterface.bulkDelete('parts', null, {});
    await queryInterface.bulkDelete('repair_types', null, {});
    await queryInterface.bulkDelete('devices', null, {});
    await queryInterface.bulkDelete('users', null, {});
  },
};
