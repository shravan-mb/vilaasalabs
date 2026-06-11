/**
 * 8th Standard – Karnataka State Board + CBSE
 * Creates a question bank and 4 test sets per subject for teacher phone 9911000002
 * (Shri Vidya Public School — subdomain: shrivdya)
 *
 * Subjects: Mathematics, Science, Social Science, English, Hindi, Kannada, Computer Science
 * Per subject: 40 MCQ questions (medium) → 4 test sets × 10 questions each
 * Each test: 10 marks, 30 minutes, status = published
 *
 * Usage (run from backend/):
 *   npm run db:seed:8th-tests
 *   npm run db:seed:8th-tests -- --reset   (drops and re-seeds this data)
 */

import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../../app.module';
import { User } from '../entities/user.entity';
import { Class } from '../entities/class.entity';
import { Question, QuestionType, DifficultyLevel } from '../entities/question.entity';
import { Test as TestEntity, TestStatus } from '../entities/test.entity';

const TEACHER_PHONE = '9911000002';
const SUBDOMAIN     = 'shrivdya';
const RESET         = process.argv.includes('--reset');

// ─────────────────────────────────────────────────────────────────────────────
// QUESTION BANK
// ─────────────────────────────────────────────────────────────────────────────

type Q = {
  subject: string;
  topic: string;
  question_text: string;
  options: string[];
  correct_answer: string;
  tags: string[];
};

function mcq(subject: string, topic: string, q: string, opts: string[], ans: string, tags: string[]): Q {
  return { subject, topic, question_text: q, options: opts, correct_answer: ans, tags };
}

// ── MATHEMATICS ──────────────────────────────────────────────────────────────
const MATH_Q: Q[] = [
  // Set 1 – Rational Numbers & Linear Equations (Q1–Q10)
  mcq('Mathematics','Rational Numbers','Which of the following is NOT a rational number?',['√4','√9','√7','3/4'],'√7',['rational-numbers','ch1']),
  mcq('Mathematics','Rational Numbers','The additive inverse of –5/8 is:',['5/8','–5/8','8/5','–8/5'],'5/8',['rational-numbers','ch1']),
  mcq('Mathematics','Rational Numbers','Between 1/3 and 1/2, a rational number is:',['2/5','1/4','3/7','5/12'],'5/12',['rational-numbers','ch1']),
  mcq('Mathematics','Rational Numbers','Product of two rational numbers is 1. If one is 4/5, the other is:',['5/4','–4/5','4/5','–5/4'],'5/4',['rational-numbers','ch1']),
  mcq('Mathematics','Rational Numbers','0.6̄ (0.666...) expressed as a fraction is:',['6/10','2/3','3/5','2/5'],'2/3',['rational-numbers','ch1']),
  mcq('Mathematics','Linear Equations','Solve: 2x + 5 = 13. The value of x is:',['3','4','5','6'],'4',['linear-equations','ch2']),
  mcq('Mathematics','Linear Equations','Solve: 3(x – 2) = 12. x equals:',['4','5','6','7'],'6',['linear-equations','ch2']),
  mcq('Mathematics','Linear Equations','If 5x – 3 = 2x + 9, then x = ?',['2','3','4','5'],'4',['linear-equations','ch2']),
  mcq('Mathematics','Linear Equations','A number is 3 more than twice another. If the smaller is 7, the larger is:',['14','15','17','18'],'17',['linear-equations','ch2']),
  mcq('Mathematics','Linear Equations','Sum of three consecutive integers is 48. The middle integer is:',['15','16','17','18'],'16',['linear-equations','ch2']),

  // Set 2 – Squares, Square Roots, Cubes, Cube Roots (Q11–Q20)
  mcq('Mathematics','Squares and Square Roots','√225 = ?',['13','14','15','16'],'15',['squares','ch6']),
  mcq('Mathematics','Squares and Square Roots','The smallest perfect square greater than 100 is:',['110','121','144','169'],'121',['squares','ch6']),
  mcq('Mathematics','Squares and Square Roots','How many perfect squares lie between 1 and 100 (exclusive)?',['8','9','10','11'],'9',['squares','ch6']),
  mcq('Mathematics','Squares and Square Roots','If a perfect square ends in 6, its square root ends in:',['2 or 8','4 or 6','6','4'],'4 or 6',['squares','ch6']),
  mcq('Mathematics','Squares and Square Roots','√0.0049 = ?',['0.07','0.7','0.007','0.049'],'0.07',['squares','ch6']),
  mcq('Mathematics','Cubes and Cube Roots','∛512 = ?',['6','7','8','9'],'8',['cubes','ch7']),
  mcq('Mathematics','Cubes and Cube Roots','∛–27 = ?',['–3','3','–9','9'],'–3',['cubes','ch7']),
  mcq('Mathematics','Cubes and Cube Roots','Which of these is a perfect cube?',['8','18','28','38'],'8',['cubes','ch7']),
  mcq('Mathematics','Cubes and Cube Roots','The cube of 0.4 is:',['0.064','0.016','0.16','0.64'],'0.064',['cubes','ch7']),
  mcq('Mathematics','Cubes and Cube Roots','∛1000 = ?',['8','9','10','11'],'10',['cubes','ch7']),

  // Set 3 – Mensuration (Q21–Q30)
  mcq('Mathematics','Mensuration','Area of a rhombus with diagonals 10 cm and 8 cm is:',['40 cm²','80 cm²','20 cm²','60 cm²'],'40 cm²',['mensuration','ch11']),
  mcq('Mathematics','Mensuration','Lateral surface area of a cube of side 6 cm is:',['144 cm²','216 cm²','36 cm²','72 cm²'],'144 cm²',['mensuration','ch11']),
  mcq('Mathematics','Mensuration','Volume of a cuboid 5 × 4 × 3 cm is:',['47 cm³','60 cm³','32 cm³','40 cm³'],'60 cm³',['mensuration','ch11']),
  mcq('Mathematics','Mensuration','Area of a trapezium with parallel sides 10 cm, 6 cm and height 5 cm is:',['35 cm²','40 cm²','45 cm²','50 cm²'],'40 cm²',['mensuration','ch11']),
  mcq('Mathematics','Mensuration','Curved surface area of a cylinder with r = 7 cm, h = 10 cm (π = 22/7) is:',['220 cm²','440 cm²','154 cm²','308 cm²'],'440 cm²',['mensuration','ch11']),
  mcq('Mathematics','Mensuration','Total surface area of a cylinder r = 7, h = 5 (π = 22/7) is:',['528 cm²','440 cm²','308 cm²','264 cm²'],'528 cm²',['mensuration','ch11']),
  mcq('Mathematics','Mensuration','Volume of a cylinder r = 3.5 cm, h = 10 cm (π = 22/7) is:',['385 cm³','770 cm³','192.5 cm³','308 cm³'],'385 cm³',['mensuration','ch11']),
  mcq('Mathematics','Mensuration','Area of a circle with radius 14 cm (π = 22/7) is:',['616 cm²','308 cm²','1232 cm²','154 cm²'],'616 cm²',['mensuration','ch11']),
  mcq('Mathematics','Mensuration','Perimeter of a rhombus with side 9 cm is:',['18 cm','27 cm','36 cm','45 cm'],'36 cm',['mensuration','ch11']),
  mcq('Mathematics','Mensuration','Area of a general quadrilateral with diagonal 12 cm and perpendicular heights 5 cm and 7 cm is:',['60 cm²','72 cm²','84 cm²','144 cm²'],'72 cm²',['mensuration','ch11']),

  // Set 4 – Exponents, Factorisation, Algebraic Identities (Q31–Q40)
  mcq('Mathematics','Exponents and Powers','2⁻⁴ = ?',['1/8','1/16','1/4','16'],'1/16',['exponents','ch12']),
  mcq('Mathematics','Exponents and Powers','(5²)³ = ?',['5⁵','5⁶','5⁸','5⁹'],'5⁶',['exponents','ch12']),
  mcq('Mathematics','Exponents and Powers','Scientific notation of 0.00345 is:',['3.45×10²','3.45×10⁻³','3.45×10⁻²','34.5×10⁻⁴'],'3.45×10⁻³',['exponents','ch12']),
  mcq('Mathematics','Algebraic Identities','(a + b)² = ?',['a²+b²','a²+ab+b²','a²+2ab+b²','2a²+2b²'],'a²+2ab+b²',['algebra','ch9']),
  mcq('Mathematics','Algebraic Identities','(a – b)² expands to:',['a²–b²','a²–2ab+b²','a²+2ab–b²','a²–2ab–b²'],'a²–2ab+b²',['algebra','ch9']),
  mcq('Mathematics','Algebraic Identities','a² – b² factors as:',['(a–b)²','(a+b)(a–b)','(a–b)(a–b)','(a+b)²'],'(a+b)(a–b)',['algebra','ch9']),
  mcq('Mathematics','Factorisation','Factorise: x² + 7x + 12',['(x+3)(x+4)','(x+2)(x+6)','(x+1)(x+12)','(x+4)(x+3)'],'(x+3)(x+4)',['factorisation','ch14']),
  mcq('Mathematics','Factorisation','Factorise: 4x² – 9',['(2x–3)²','(4x–3)(x+3)','(2x+3)(2x–3)','(2x–9)(2x+1)'],'(2x+3)(2x–3)',['factorisation','ch14']),
  mcq('Mathematics','Factorisation','Factorise: 6x² + 11x + 3',['(2x+3)(3x+1)','(3x+3)(2x+1)','(6x+1)(x+3)','(2x+1)(3x+3)'],'(2x+3)(3x+1)',['factorisation','ch14']),
  mcq('Mathematics','Comparing Quantities','A price increases from ₹800 to ₹1000. The percentage increase is:',['20%','25%','15%','10%'],'25%',['percentages','ch8']),
];

// ── SCIENCE ───────────────────────────────────────────────────────────────────
const SCIENCE_Q: Q[] = [
  // Set 1 – Crop Production, Microorganisms, Metals & Non-Metals (Q1–Q10)
  mcq('Science','Crop Production','The process of loosening and turning the soil is called:',['Sowing','Tilling/Ploughing','Irrigation','Manuring'],'Tilling/Ploughing',['agriculture','ch1']),
  mcq('Science','Crop Production','Crop grown during June–November is called:',['Rabi crop','Kharif crop','Zaid crop','Cash crop'],'Kharif crop',['agriculture','ch1']),
  mcq('Science','Crop Production','Excessive use of chemical fertilisers leads to:',['Better yield always','Soil degradation','Faster growth','Water retention'],'Soil degradation',['agriculture','ch1']),
  mcq('Science','Microorganisms','Microorganisms used in making curd are:',['Fungi','Algae','Bacteria','Virus'],'Bacteria',['microorganisms','ch2']),
  mcq('Science','Microorganisms','Which microorganism causes malaria?',['Bacteria','Virus','Protozoan','Fungi'],'Protozoan',['microorganisms','ch2']),
  mcq('Science','Microorganisms','Antibiotics are produced by:',['Virus','Bacteria/Fungi','Algae','Protozoa'],'Bacteria/Fungi',['microorganisms','ch2']),
  mcq('Science','Metals and Non-Metals','Which metal is liquid at room temperature?',['Iron','Mercury','Aluminium','Copper'],'Mercury',['metals','ch4']),
  mcq('Science','Metals and Non-Metals','Non-metals are generally:',['Good conductors','Malleable','Poor conductors','Lustrous'],'Poor conductors',['metals','ch4']),
  mcq('Science','Metals and Non-Metals','Rusting of iron is a:',['Physical change','Reversible change','Chemical change','No change'],'Chemical change',['metals','ch4']),
  mcq('Science','Metals and Non-Metals','Which non-metal is a good conductor of electricity?',['Sulphur','Graphite','Phosphorus','Iodine'],'Graphite',['metals','ch4']),

  // Set 2 – Coal, Petroleum, Combustion, Conservation (Q11–Q20)
  mcq('Science','Coal and Petroleum','Fossil fuels are formed from:',['Volcanoes','Dead plants and animals over millions of years','Sea water','Rocks'],'Dead plants and animals over millions of years',['energy','ch5']),
  mcq('Science','Coal and Petroleum','CNG stands for:',['Compressed Natural Gas','Carbon Natural Gas','Coal Natural Gas','Condensed Natural Gas'],'Compressed Natural Gas',['energy','ch5']),
  mcq('Science','Coal and Petroleum','Which is NOT a product of petroleum refining?',['Kerosene','Petrol','Coal','LPG'],'Coal',['energy','ch5']),
  mcq('Science','Combustion and Flame','The substance that supports combustion is:',['Nitrogen','Carbon dioxide','Oxygen','Hydrogen'],'Oxygen',['combustion','ch6']),
  mcq('Science','Combustion and Flame','The innermost zone of a candle flame is:',['Hottest','Luminous zone','Dark zone','Outermost zone'],'Dark zone',['combustion','ch6']),
  mcq('Science','Combustion and Flame','Ignition temperature is:',['Temperature at which a substance melts','Minimum temperature to start burning','Boiling point','Room temperature'],'Minimum temperature to start burning',['combustion','ch6']),
  mcq('Science','Conservation','Biodiversity hotspot in India includes:',['Thar Desert','Western Ghats','Indo-Gangetic Plain','Deccan Plateau'],'Western Ghats',['conservation','ch7']),
  mcq('Science','Conservation','A biosphere reserve protects:',['Only animals','Only plants','Entire ecosystem including humans','Only endangered species'],'Entire ecosystem including humans',['conservation','ch7']),
  mcq('Science','Conservation','Red Data Book contains information about:',['Extinct animals only','Threatened species','Common species','Domestic animals'],'Threatened species',['conservation','ch7']),
  mcq('Science','Conservation','Deforestation leads to:',['Increase in rainfall','Decrease in soil erosion','Global warming and floods','Better biodiversity'],'Global warming and floods',['conservation','ch7']),

  // Set 3 – Force, Friction, Sound (Q21–Q30)
  mcq('Science','Force and Pressure','Pressure = Force ÷ Area. If force is 100 N and area is 2 m², pressure is:',['200 Pa','50 Pa','100 Pa','25 Pa'],'50 Pa',['force','ch11']),
  mcq('Science','Force and Pressure','Atmospheric pressure at sea level is approximately:',['100,000 Pa','10,000 Pa','1,000 Pa','1,00,00,000 Pa'],'100,000 Pa',['force','ch11']),
  mcq('Science','Force and Pressure','Liquids exert pressure in:',['Only downward direction','Upward direction only','All directions','Horizontal direction only'],'All directions',['force','ch11']),
  mcq('Science','Friction','Friction is caused by:',['Smoothness of surface','Irregularities on surfaces','Gravity','Density of objects'],'Irregularities on surfaces',['friction','ch12']),
  mcq('Science','Friction','Rolling friction is __________ sliding friction.',['Greater than','Less than','Equal to','Not related to'],'Less than',['friction','ch12']),
  mcq('Science','Friction','Ball bearings are used to:',['Increase friction','Convert rolling to sliding friction','Convert sliding to rolling friction','Increase weight'],'Convert sliding to rolling friction',['friction','ch12']),
  mcq('Science','Sound','Sound travels fastest in:',['Air','Water','Vacuum','Solid steel'],'Solid steel',['sound','ch13']),
  mcq('Science','Sound','The unit of loudness of sound is:',['Hertz','Decibel','Newton','Pascal'],'Decibel',['sound','ch13']),
  mcq('Science','Sound','Frequency range of human hearing is:',['20 Hz – 20,000 Hz','2 Hz – 2,000 Hz','200 Hz – 2,00,000 Hz','0 Hz – 100 Hz'],'20 Hz – 20,000 Hz',['sound','ch13']),
  mcq('Science','Sound','An echo is produced when sound is:',['Absorbed','Refracted','Reflected','Diffracted'],'Reflected',['sound','ch13']),

  // Set 4 – Light, Cell, Reproduction, Pollution (Q31–Q40)
  mcq('Science','Light','The angle of incidence equals angle of reflection — this is:',['Refraction of light','Law of reflection','Total internal reflection','Dispersion'],'Law of reflection',['light','ch16']),
  mcq('Science','Light','A concave mirror is used in:',['Rear-view mirrors','Periscopes','Torches and headlights','Cameras'],'Torches and headlights',['light','ch16']),
  mcq('Science','Light','The splitting of white light into colours is called:',['Reflection','Refraction','Dispersion','Absorption'],'Dispersion',['light','ch16']),
  mcq('Science','Cell','The powerhouse of the cell is:',['Nucleus','Ribosome','Mitochondria','Chloroplast'],'Mitochondria',['cell','ch8']),
  mcq('Science','Cell','Cell wall is present in:',['Animal cells only','Plant cells only','Both plant and animal cells','Neither'],'Plant cells only',['cell','ch8']),
  mcq('Science','Cell','The largest cell in the human body is:',['Red blood cell','Nerve cell','Liver cell','Egg cell'],'Nerve cell',['cell','ch8']),
  mcq('Science','Reproduction','Reproduction in Amoeba occurs by:',['Budding','Binary fission','Fragmentation','Spore formation'],'Binary fission',['reproduction','ch9']),
  mcq('Science','Reproduction','The metamorphosis in frog includes the stage:',['Larva → Pupa → Adult','Egg → Tadpole → Adult','Egg → Pupa → Adult','Tadpole → Larva → Adult'],'Egg → Tadpole → Adult',['reproduction','ch9']),
  mcq('Science','Pollution','Acid rain is mainly caused by:',['CO₂','SO₂ and NO₂','O₃','N₂'],'SO₂ and NO₂',['pollution','ch18']),
  mcq('Science','Pollution','The ozone layer protects us from:',['UV radiation','Acid rain','Greenhouse effect','Earthquakes'],'UV radiation',['pollution','ch18']),
];

// ── SOCIAL SCIENCE ────────────────────────────────────────────────────────────
const SOC_Q: Q[] = [
  // Set 1 – How British Rule Began, Revenue Systems (Q1–Q10)
  mcq('Social Science','History – British Rule','The Battle of Plassey was fought in:',['1757','1764','1857','1947'],'1757',['history','british-rule','ch2']),
  mcq('Social Science','History – British Rule','The Permanent Settlement of 1793 was introduced by:',['Warren Hastings','Lord Cornwallis','Lord Dalhousie','Lord Clive'],'Lord Cornwallis',['history','ch3']),
  mcq('Social Science','History – British Rule','Ryotwari system was introduced in:',['Bengal','Bombay and Madras','Punjab','UP'],'Bombay and Madras',['history','ch3']),
  mcq('Social Science','History – British Rule','The doctrine of Lapse was used by:',['Lord Cornwallis','Lord Dalhousie','Lord Curzon','Lord Hastings'],'Lord Dalhousie',['history','ch2']),
  mcq('Social Science','History – British Rule','The Sepoy Mutiny / First War of Independence occurred in:',['1757','1764','1857','1885'],'1857',['history','ch5']),
  mcq('Social Science','History – 1857 Revolt','The revolt of 1857 began at:',['Delhi','Meerut','Kanpur','Lucknow'],'Meerut',['history','ch5']),
  mcq('Social Science','History – 1857 Revolt','Mangal Pandey was a soldier of:',['British army','Maratha army','34th Native Infantry','Bengal Lancers'],'34th Native Infantry',['history','ch5']),
  mcq('Social Science','History – 1857 Revolt','After the 1857 revolt, India came under the direct rule of:',['East India Company','British Crown','Mughal Emperor','Indian National Congress'],'British Crown',['history','ch5']),
  mcq('Social Science','History – Industries','The first cotton textile mill in India was set up in:',['Bombay (1854)','Calcutta (1855)','Madras (1860)','Surat (1850)'],'Bombay (1854)',['history','ch7']),
  mcq('Social Science','Civics – Constitution','The Indian Constitution came into effect on:',['15 August 1947','26 January 1950','26 November 1949','2 October 1950'],'26 January 1950',['civics','constitution','ch1']),

  // Set 2 – Constitution, Secularism, Parliament (Q11–Q20)
  mcq('Social Science','Civics – Constitution','The Indian Constitution was drafted by a:',['Parliament','Constituent Assembly','Lok Sabha','Supreme Court'],'Constituent Assembly',['civics','ch1']),
  mcq('Social Science','Civics – Secularism','India is a secular state, which means:',['State promotes one religion','State has no official religion','State is against religion','Majority religion is official'],'State has no official religion',['civics','ch2']),
  mcq('Social Science','Civics – Parliament','The lower house of Parliament is called:',['Rajya Sabha','Vidhan Parishad','Lok Sabha','Vidhan Sabha'],'Lok Sabha',['civics','parliament','ch3']),
  mcq('Social Science','Civics – Parliament','A bill becomes a law after it is:',['Passed by Lok Sabha','Passed by Rajya Sabha','Passed by both houses and signed by President','Approved by Supreme Court'],'Passed by both houses and signed by President',['civics','ch3']),
  mcq('Social Science','Civics – Judiciary','The highest court in India is:',['High Court','District Court','Supreme Court','Session Court'],'Supreme Court',['civics','judiciary','ch5']),
  mcq('Social Science','Civics – Marginalisation','Which community is considered a marginalised group in India?',['Doctors','Adivasis (Tribals)','IT professionals','Businessmen'],'Adivasis (Tribals)',['civics','ch6']),
  mcq('Social Science','Geography – Resources','Which of the following is a renewable resource?',['Coal','Petroleum','Solar energy','Natural gas'],'Solar energy',['geography','resources','ch1']),
  mcq('Social Science','Geography – Resources','Soil is formed by the process of:',['Weathering of rocks','Evaporation of water','Condensation','Photosynthesis'],'Weathering of rocks',['geography','ch2']),
  mcq('Social Science','Geography – Agriculture','India is the largest producer of:',['Wheat','Rice','Tea','Sugarcane'],'Tea',['geography','agriculture','ch4']),
  mcq('Social Science','Geography – Agriculture','Green Revolution in India is associated with:',['Dr. M. S. Swaminathan','Dr. APJ Abdul Kalam','Dr. Ambedkar','Jawaharlal Nehru'],'Dr. M. S. Swaminathan',['geography','ch4']),

  // Set 3 – Karnataka History, Resources, Industries (Q21–Q30)
  mcq('Social Science','History – Nationalism','Indian National Congress was founded in:',['1857','1885','1905','1920'],'1885',['history','nationalism','ch9']),
  mcq('Social Science','History – Nationalism','The partition of Bengal (1905) was done by:',['Lord Cornwallis','Lord Curzon','Lord Mountbatten','Lord Dalhousie'],'Lord Curzon',['history','ch9']),
  mcq('Social Science','History – Tribals','Which tribal leader led the Santhal rebellion?',['Birsa Munda','Sidhu and Kanhu','Tilka Manjhi','Alluri Sita Ramaraju'],'Sidhu and Kanhu',['history','tribals','ch4']),
  mcq('Social Science','History – Weavers','The decline of Indian handloom weaving was mainly due to:',['Lack of raw material','Cheap machine-made cloth from Britain','Natural disasters','Lack of weavers'],'Cheap machine-made cloth from Britain',['history','ch7']),
  mcq('Social Science','History – Education','The Wood\'s Despatch of 1854 dealt with:',['Revenue collection','Education policy','Army reform','Trade policy'],'Education policy',['history','ch8']),
  mcq('Social Science','Geography – Minerals','Which state is the largest producer of iron ore in India?',['Rajasthan','Odisha','Goa','Karnataka'],'Odisha',['geography','minerals','ch3']),
  mcq('Social Science','Geography – Industries','The Silicon Valley of India is:',['Mumbai','Delhi','Bangalore','Hyderabad'],'Bangalore',['geography','industries','ch5']),
  mcq('Social Science','Geography – Human Resources','The most important resource of a country is its:',['Land','Minerals','Human resources','Forest'],'Human resources',['geography','ch6']),
  mcq('Social Science','Civics – Public Facilities','Water is a:',['Private good','Public facility','Luxury item','Commercial product'],'Public facility',['civics','ch9']),
  mcq('Social Science','Civics – Law','The Right to Education Act was passed in:',['2002','2009','2010','2005'],'2009',['civics','law','ch10']),

  // Set 4 – Mixed Revision: CBSE + Karnataka Board Focus (Q31–Q40)
  mcq('Social Science','History – After Independence','The first Prime Minister of independent India was:',['Sardar Patel','Dr. Ambedkar','Jawaharlal Nehru','Rajendra Prasad'],'Jawaharlal Nehru',['history','independence','ch10']),
  mcq('Social Science','History – After Independence','India became a Republic on 26 January:',['1947','1948','1950','1952'],'1950',['history','ch10']),
  mcq('Social Science','Geography – Land Resources','Black soil is best suited for growing:',['Rice','Cotton','Wheat','Tea'],'Cotton',['geography','soil','ch2']),
  mcq('Social Science','Geography – Water','Rainwater harvesting is done to:',['Increase evaporation','Conserve and store rainwater','Cause floods','Increase salinity'],'Conserve and store rainwater',['geography','water','ch2']),
  mcq('Social Science','Civics – Fundamental Rights','The Right to Equality is guaranteed under Article:',['Article 14','Article 19','Article 21','Article 32'],'Article 14',['civics','rights','ch1']),
  mcq('Social Science','Civics – Fundamental Rights','Right to Freedom of Religion is a:',['Directive Principle','Fundamental Right','Fundamental Duty','Constitutional Amendment'],'Fundamental Right',['civics','rights','ch1']),
  mcq('Social Science','History – Reform','Raja Ram Mohan Roy founded the:',['Arya Samaj','Brahmo Samaj','Theosophical Society','Ramakrishna Mission'],'Brahmo Samaj',['history','reform','ch8']),
  mcq('Social Science','History – Women Reform','The practice of Sati was abolished by:',['Lord Curzon','Lord Dalhousie','Lord William Bentinck','Lord Cornwallis'],'Lord William Bentinck',['history','reform','ch8']),
  mcq('Social Science','Geography – Agriculture','Slash and burn agriculture is also known as:',['Terrace farming','Jhum cultivation','Plantation farming','Mixed farming'],'Jhum cultivation',['geography','agriculture','ch4']),
  mcq('Social Science','Geography – Industries','Jamshedpur is known for:',['Textile industry','Iron and steel industry','IT industry','Chemical industry'],'Iron and steel industry',['geography','industries','ch5']),
];

// ── ENGLISH ───────────────────────────────────────────────────────────────────
const ENGLISH_Q: Q[] = [
  // Set 1 – Grammar: Tenses and Reported Speech (Q1–Q10)
  mcq('English','Grammar – Tenses','Choose the correct tense: "She ______ her homework when I arrived." ',['was doing','did','has done','does'],'was doing',['grammar','tenses','set1']),
  mcq('English','Grammar – Tenses','The sentence "I have been reading for two hours" is in:',['Simple present','Past perfect continuous','Present perfect continuous','Future perfect'],'Present perfect continuous',['grammar','tenses','set1']),
  mcq('English','Grammar – Tenses','Change to past tense: "They play cricket every day."',['They played cricket every day.','They were played cricket.','They play cricket yesterday.','They playing cricket.'],'They played cricket every day.',['grammar','tenses','set1']),
  mcq('English','Grammar – Reported Speech','Change to reported speech: He said, "I am tired."',['He said that he was tired.','He said that I am tired.','He told he was tired.','He said that he is tired.'],'He said that he was tired.',['grammar','reported-speech','set1']),
  mcq('English','Grammar – Reported Speech','The reporting verb changes with time shift. "Will" becomes:',['Would','Shall','Should','May'],'Would',['grammar','reported-speech','set1']),
  mcq('English','Grammar – Passive Voice','Change to passive: "The teacher explained the lesson."',['The lesson was explained by the teacher.','The lesson has been explained.','The teacher was explained.','The lesson is explaining.'],'The lesson was explained by the teacher.',['grammar','passive-voice','set1']),
  mcq('English','Grammar – Passive Voice','The passive form of "She is writing a letter" is:',['A letter is being written by her.','A letter was written.','A letter is written.','A letter written by her.'],'A letter is being written by her.',['grammar','passive-voice','set1']),
  mcq('English','Grammar – Articles','Use the correct article: "He is ______ honest man."',['a','an','the','no article'],'an',['grammar','articles','set1']),
  mcq('English','Grammar – Prepositions','Choose the correct preposition: "She is good ______ mathematics."',['in','at','on','for'],'at',['grammar','prepositions','set1']),
  mcq('English','Grammar – Conjunctions','Fill in: "She worked hard ______ she failed."',['so','but','and','because'],'but',['grammar','conjunctions','set1']),

  // Set 2 – Grammar: Conditionals, Modals, Comprehension (Q11–Q20)
  mcq('English','Grammar – Conditionals','Type 2 conditional: "If I ______ rich, I would travel the world."',['was/were','am','have been','be'],'was/were',['grammar','conditionals','set2']),
  mcq('English','Grammar – Conditionals','Which is a Type 1 conditional?',['If she studied, she would pass.','If she studies, she will pass.','If she had studied, she would have passed.','If she study, she will pass.'],'If she studies, she will pass.',['grammar','conditionals','set2']),
  mcq('English','Grammar – Modals','"You ______ see a doctor immediately" (strong advice):',['might','could','should','would'],'should',['grammar','modals','set2']),
  mcq('English','Grammar – Modals','"May I come in?" — "May" here expresses:',['Ability','Necessity','Permission','Possibility'],'Permission',['grammar','modals','set2']),
  mcq('English','Grammar – Subject-Verb','The news ______ shocking. (correct form)',['were','are','is','have been'],'is',['grammar','subject-verb','set2']),
  mcq('English','Grammar – Narration','She asked, "Where do you live?" In indirect speech:',['She asked where I lived.','She asked where do I live.','She asked where I live.','She asked me where did I live.'],'She asked where I lived.',['grammar','narration','set2']),
  mcq('English','Vocabulary','The antonym of "transparent" is:',['Clear','Opaque','Translucent','Bright'],'Opaque',['vocabulary','set2']),
  mcq('English','Vocabulary','The synonym of "enormous" is:',['Tiny','Huge','Pretty','Smooth'],'Huge',['vocabulary','set2']),
  mcq('English','Vocabulary','Choose the correct spelling:',['Accomodation','Accommodation','Acommodation','Acomodation'],'Accommodation',['vocabulary','spelling','set2']),
  mcq('English','Reading Comprehension','A topic sentence in a paragraph:',['Concludes the paragraph','Introduces the main idea','Provides examples','Gives statistics'],'Introduces the main idea',['comprehension','set2']),

  // Set 3 – Literature: Honeydew and It So Happened (Q21–Q30)
  mcq('English','Literature','In the chapter "The Best Christmas Present in the World", the story is about:',['A soldier who gets a gift','Letters found in a roll-top desk revealing a WWI story','A Christmas party','A magical gift'],'Letters found in a roll-top desk revealing a WWI story',['literature','honeydew','set3']),
  mcq('English','Literature','The poem "The Ant and the Cricket" is based on Aesop\'s fable and teaches:',['Courage','Hard work and foresight','Kindness','Friendship'],'Hard work and foresight',['literature','poetry','set3']),
  mcq('English','Literature','In "It So Happened – The Tsunami", the story shows:',['Animals sense disasters early','Tsunamis are caused by earthquakes','Swimming skills','Boat navigation'],'Animals sense disasters early',['literature','it-so-happened','set3']),
  mcq('English','Literature','"Geography Lesson" (poem) — the poet is:',['Zulfikar Ghose','Vikram Seth','Rabindranath Tagore','Kamala Das'],'Zulfikar Ghose',['literature','poetry','set3']),
  mcq('English','Literature','In "The Selfish Giant" (It So Happened), the giant\'s garden becomes cold because:',['He destroys it','He does not allow children to play','It snows always','Flowers die'],'He does not allow children to play',['literature','it-so-happened','set3']),
  mcq('English','Grammar – Figures of Speech','Identify the figure of speech: "The wind whispered through the trees."',['Simile','Metaphor','Personification','Alliteration'],'Personification',['grammar','figures-of-speech','set3']),
  mcq('English','Grammar – Figures of Speech','"As brave as a lion" is an example of:',['Metaphor','Simile','Personification','Hyperbole'],'Simile',['grammar','figures-of-speech','set3']),
  mcq('English','Grammar – Punctuation','Which sentence uses a comma correctly?',['I like apples oranges and mangoes.','I like, apples, oranges, and mangoes.','I like apples, oranges, and mangoes.','I, like apples, oranges and mangoes.'],'I like apples, oranges, and mangoes.',['grammar','punctuation','set3']),
  mcq('English','Writing','A formal letter is addressed to:',['Friends only','Official persons or authorities','Family members','Pen pals'],'Official persons or authorities',['writing','set3']),
  mcq('English','Writing','The subject line in a formal letter:',['Is optional','States the purpose of the letter','Is the writer\'s name','Is the date'],'States the purpose of the letter',['writing','set3']),

  // Set 4 – Advanced Grammar, Prose, Poetry (Q31–Q40)
  mcq('English','Grammar – Transformation','Transform: "He is too weak to walk." (using "so...that")',['He is so weak that he cannot walk.','He is so weak that he can walk.','He is weak enough not to walk.','He can walk because he is weak.'],'He is so weak that he cannot walk.',['grammar','transformation','set4']),
  mcq('English','Grammar – Word Order','Arrange in correct order: long / the / was / lecture / very',['The lecture was very long.','Very long was the lecture.','The very long lecture was.','Long was the lecture very.'],'The lecture was very long.',['grammar','word-order','set4']),
  mcq('English','Literature','In "Jalebis" (It So Happened), Makku feels guilty because:',['He lost the coins','He spent the fee money on jalebis','He failed the exam','He broke a window'],'He spent the fee money on jalebis',['literature','it-so-happened','set4']),
  mcq('English','Literature','"On the Grasshopper and Cricket" — the poem is by:',['John Keats','William Wordsworth','P. B. Shelley','Alfred Tennyson'],'John Keats',['literature','poetry','set4']),
  mcq('English','Literature','The theme of "The Summit Within" (Honeydew) is:',['Mountain climbing is dangerous','Inner strength and willpower matter more','We should not climb mountains','Height is everything'],'Inner strength and willpower matter more',['literature','honeydew','set4']),
  mcq('English','Grammar – Clauses','Identify the type: "Although it was raining, we went out."',['Conditional clause','Concessive clause','Relative clause','Noun clause'],'Concessive clause',['grammar','clauses','set4']),
  mcq('English','Vocabulary – Idioms','"To burn the midnight oil" means:',['To start a fire','To work or study late at night','To waste electricity','To cook at night'],'To work or study late at night',['vocabulary','idioms','set4']),
  mcq('English','Vocabulary – Proverbs','"Actions speak louder than words" means:',['Talking is better than acting','What you do is more important than what you say','Silence is golden','Words have power'],'What you do is more important than what you say',['vocabulary','proverbs','set4']),
  mcq('English','Grammar – Degrees','Superlative degree of "good" is:',['Better','Best','Most good','Gooder'],'Best',['grammar','degrees','set4']),
  mcq('English','Grammar – Degrees','Change to comparative: "He is the tallest boy in the class."',['He is taller than most other boys.','He is tall than other boys.','No other boy is as tall than him.','He is tallest boy.'],'He is taller than most other boys.',['grammar','degrees','set4']),
];

// ── HINDI ─────────────────────────────────────────────────────────────────────
const HINDI_Q: Q[] = [
  // Set 1 – व्याकरण: संज्ञा, सर्वनाम, क्रिया (Q1–Q10)
  mcq('Hindi','व्याकरण – संज्ञा','जो शब्द किसी व्यक्ति, स्थान या वस्तु के नाम को बताते हैं उन्हें कहते हैं:',['सर्वनाम','क्रिया','संज्ञा','विशेषण'],'संज्ञा',['grammar','sangya','set1']),
  mcq('Hindi','व्याकरण – संज्ञा','"धैर्य" किस प्रकार की संज्ञा है?',['व्यक्तिवाचक','जातिवाचक','भाववाचक','समूहवाचक'],'भाववाचक',['grammar','sangya','set1']),
  mcq('Hindi','व्याकरण – सर्वनाम','निम्नलिखित में सर्वनाम कौन-सा है?',['राम','वह','पुस्तक','दिल्ली'],'वह',['grammar','sarvanam','set1']),
  mcq('Hindi','व्याकरण – विशेषण','"वह लड़की बहुत सुंदर है" — इस वाक्य में विशेषण है:',['वह','लड़की','सुंदर','है'],'सुंदर',['grammar','visheshan','set1']),
  mcq('Hindi','व्याकरण – क्रिया','अकर्मक क्रिया उसे कहते हैं जिसमें:',['कर्म हो','कर्म न हो','विशेषण हो','दो कर्म हों'],'कर्म न हो',['grammar','kriya','set1']),
  mcq('Hindi','व्याकरण – काल','"वह पढ़ रहा है" — यह वाक्य किस काल में है?',['भूतकाल','भविष्यकाल','सामान्य वर्तमान','अपूर्ण वर्तमान'],'अपूर्ण वर्तमान',['grammar','tense','set1']),
  mcq('Hindi','व्याकरण – वचन','"पत्ता" का बहुवचन है:',['पत्ते','पत्तों','पत्तियाँ','पत्ती'],'पत्ते',['grammar','vachan','set1']),
  mcq('Hindi','व्याकरण – लिंग','"नदी" शब्द का लिंग है:',['पुल्लिंग','स्त्रीलिंग','नपुंसकलिंग','उभयलिंग'],'स्त्रीलिंग',['grammar','ling','set1']),
  mcq('Hindi','व्याकरण – संधि','"विद्यालय" में कौन-सी संधि है?',['स्वर संधि','व्यंजन संधि','विसर्ग संधि','कोई नहीं'],'स्वर संधि',['grammar','sandhi','set1']),
  mcq('Hindi','व्याकरण – उपसर्ग','"अनुचित" में उपसर्ग है:',['अन','अनु','चित','उचित'],'अन',['grammar','upsarg','set1']),

  // Set 2 – व्याकरण: समास, अलंकार, मुहावरे (Q11–Q20)
  mcq('Hindi','व्याकरण – समास','"राजपुत्र" में कौन-सा समास है?',['तत्पुरुष','बहुव्रीहि','द्वंद्व','कर्मधारय'],'तत्पुरुष',['grammar','samaas','set2']),
  mcq('Hindi','व्याकरण – समास','"पीतांबर" में कौन-सा समास है?',['तत्पुरुष','द्विगु','बहुव्रीहि','कर्मधारय'],'बहुव्रीहि',['grammar','samaas','set2']),
  mcq('Hindi','व्याकरण – अलंकार','"चरण कमल बंदौं हरिराई" में अलंकार है:',['रूपक','उपमा','अनुप्रास','श्लेष'],'रूपक',['grammar','alankar','set2']),
  mcq('Hindi','व्याकरण – अलंकार','"सागर-सा गहरा है वह" में अलंकार है:',['रूपक','उपमा','उत्प्रेक्षा','अनुप्रास'],'उपमा',['grammar','alankar','set2']),
  mcq('Hindi','व्याकरण – मुहावरे','"आँखें खुलना" मुहावरे का अर्थ है:',['नींद टूटना','सच्चाई समझ आना','आँखें चमकना','खुशी होना'],'सच्चाई समझ आना',['vocabulary','muhavare','set2']),
  mcq('Hindi','व्याकरण – लोकोक्ति','"जैसी करनी वैसी भरनी" का अर्थ है:',['भाग्य सब बनाता है','जो जैसा करता है वैसा ही फल पाता है','परिश्रम सफलता देता है','धन ही सब कुछ है'],'जो जैसा करता है वैसा ही फल पाता है',['vocabulary','lokokti','set2']),
  mcq('Hindi','व्याकरण – पर्यायवाची','"सूर्य" का पर्यायवाची नहीं है:',['रवि','भानु','दिनकर','शशि'],'शशि',['vocabulary','paryayavachi','set2']),
  mcq('Hindi','व्याकरण – विलोम','"आदि" का विलोम है:',['प्रारंभ','अंत','मध्य','आरंभ'],'अंत',['vocabulary','vilom','set2']),
  mcq('Hindi','व्याकरण – वाक्य भेद','"क्या तुम वहाँ गए?" किस प्रकार का वाक्य है?',['विधानवाचक','प्रश्नवाचक','आज्ञावाचक','विस्मयादिबोधक'],'प्रश्नवाचक',['grammar','vakya-bhed','set2']),
  mcq('Hindi','व्याकरण – प्रत्यय','"लिखाई" में प्रत्यय है:',['लिख','आई','खाई','लि'],'आई',['grammar','pratyay','set2']),

  // Set 3 – वसंत भाग 3: गद्य और पद्य (Q21–Q30)
  mcq('Hindi','साहित्य – वसंत','कबीर के दोहों में मुख्यतः क्या संदेश है?',['राजनीति','ईश्वर भक्ति और मानवता','युद्ध की वीरता','प्रकृति का वर्णन'],'ईश्वर भक्ति और मानवता',['literature','vasant','set3']),
  mcq('Hindi','साहित्य – वसंत','सूरदास किस भाषा में काव्य रचते थे?',['संस्कृत','ब्रजभाषा','अवधी','खड़ीबोली'],'ब्रजभाषा',['literature','vasant','set3']),
  mcq('Hindi','साहित्य','मीराबाई किसकी भक्त थीं?',['राम','कृष्ण','शिव','विष्णु'],'कृष्ण',['literature','poetry','set3']),
  mcq('Hindi','साहित्य – व्याकरण','रस के कितने भेद होते हैं?',['7','8','9','11'],'9',['grammar','ras','set3']),
  mcq('Hindi','साहित्य','दीवानों की हस्ती — इस कविता का मूलभाव है:',['समाज की आलोचना','जीवन में मस्ती और परोपकार','भक्ति','प्रकृति-प्रेम'],'जीवन में मस्ती और परोपकार',['literature','vasant','set3']),
  mcq('Hindi','साहित्य','भारत की खोज — किसकी रचना है?',['प्रेमचंद','जवाहरलाल नेहरू','रवीन्द्रनाथ टैगोर','महादेवी वर्मा'],'जवाहरलाल नेहरू',['literature','set3']),
  mcq('Hindi','व्याकरण – छंद','दोहा छंद में चरणों की संख्या होती है:',['2','4','6','8'],'4',['grammar','chhand','set3']),
  mcq('Hindi','व्याकरण – शब्द भेद','तद्भव शब्द किससे बने होते हैं?',['संस्कृत से विकृत होकर','अरबी-फारसी से','अंग्रेज़ी से','देशज शब्दों से'],'संस्कृत से विकृत होकर',['grammar','shabd','set3']),
  mcq('Hindi','व्याकरण','निपात शब्द "तो" किस वाक्य में है?',['वह तो आएगा।','वह जाएगा।','वह आया।','वह पढ़ता है।'],'वह तो आएगा।',['grammar','nipat','set3']),
  mcq('Hindi','व्याकरण – विराम चिह्न','प्रश्नवाचक चिह्न है:',['!','?',',',':'],'?',['grammar','punctuation','set3']),

  // Set 4 – Mixed: Grammar + Literature + Writing (Q31–Q40)
  mcq('Hindi','व्याकरण – अशुद्ध वाक्य','शुद्ध वाक्य चुनिए:',['मुझे प्यास लग रही है।','मुझको प्यास लग रही है।','मेरे को प्यास लग रही है।','मुझसे प्यास लग रही है।'],'मुझे प्यास लग रही है।',['grammar','correction','set4']),
  mcq('Hindi','व्याकरण – मिश्र वाक्य','मिश्र वाक्य में होते हैं:',['केवल एक उपवाक्य','एक मुख्य और एक आश्रित उपवाक्य','दो समान उपवाक्य','कोई उपवाक्य नहीं'],'एक मुख्य और एक आश्रित उपवाक्य',['grammar','vakya','set4']),
  mcq('Hindi','साहित्य','हिंदी साहित्य का आदिकाल किसे कहते हैं?',['भक्तिकाल','रीतिकाल','वीरगाथाकाल','आधुनिककाल'],'वीरगाथाकाल',['literature','history','set4']),
  mcq('Hindi','साहित्य – कहानी','मुंशी प्रेमचंद की प्रसिद्ध कहानी है:',['दीपदान','पूस की रात','आनंदमठ','गोरा'],'पूस की रात',['literature','story','set4']),
  mcq('Hindi','साहित्य – निबंध','हिंदी में निबंध को कहते हैं:',['कहानी','कविता','ललित गद्य रचना','नाटक'],'ललित गद्य रचना',['literature','essay','set4']),
  mcq('Hindi','व्याकरण – कारक','"राम ने सेब खाया" में "ने" किस कारक का चिह्न है?',['कर्म कारक','कर्ता कारक','करण कारक','सम्प्रदान कारक'],'कर्ता कारक',['grammar','karak','set4']),
  mcq('Hindi','व्याकरण – कारक','"वह दिल्ली से आया" में "से" कौन-सा कारक है?',['कर्म','अपादान','करण','सम्बंध'],'अपादान',['grammar','karak','set4']),
  mcq('Hindi','व्याकरण – तद्भव','"आग" किसका तद्भव रूप है?',['अग्नि','वायु','जल','पृथ्वी'],'अग्नि',['grammar','shabdroop','set4']),
  mcq('Hindi','साहित्य','रामधारी सिंह दिनकर किस काल के कवि हैं?',['भक्तिकाल','रीतिकाल','आधुनिक काल','छायावाद'],'आधुनिक काल',['literature','set4']),
  mcq('Hindi','साहित्य – पत्र लेखन','औपचारिक पत्र में "महोदय" का प्रयोग किया जाता है:',['मित्र को','अधिकारी को','परिवार को','सभी को'],'अधिकारी को',['writing','set4']),
];

// ── KANNADA ───────────────────────────────────────────────────────────────────
const KANNADA_Q: Q[] = [
  // Set 1 – ವ್ಯಾಕರಣ: ನಾಮಪದ, ಸರ್ವನಾಮ, ಕ್ರಿಯಾಪದ (Q1–Q10)
  mcq('Kannada','ವ್ಯಾಕರಣ – ನಾಮಪದ','ವ್ಯಕ್ತಿ, ಸ್ಥಳ, ವಸ್ತುಗಳ ಹೆಸರನ್ನು ತಿಳಿಸುವ ಪದಗಳನ್ನು ಏನೆಂದು ಕರೆಯುತ್ತಾರೆ?',['ಕ್ರಿಯಾಪದ','ನಾಮಪದ','ವಿಶೇಷಣ','ಅವ್ಯಯ'],'ನಾಮಪದ',['grammar','namapada','set1']),
  mcq('Kannada','ವ್ಯಾಕರಣ – ಸರ್ವನಾಮ','ಕೆಳಗಿನ ಯಾವ ಪದ ಸರ್ವನಾಮ?',['ರಾಮ','ಅವನು','ಮನೆ','ಬೆಂಗಳೂರು'],'ಅವನು',['grammar','sarvanama','set1']),
  mcq('Kannada','ವ್ಯಾಕರಣ – ಲಿಂಗ','"ಅವಳು" ಎಂಬ ಪದ ಯಾವ ಲಿಂಗ?',['ಪುಲ್ಲಿಂಗ','ಸ್ತ್ರೀಲಿಂಗ','ನಪುಂಸಕಲಿಂಗ','ಉಭಯಲಿಂಗ'],'ಸ್ತ್ರೀಲಿಂಗ',['grammar','linga','set1']),
  mcq('Kannada','ವ್ಯಾಕರಣ – ವಚನ','"ಮರ" ಎಂಬ ಪದದ ಬಹುವಚನ ರೂಪ:',['ಮರಗಳು','ಮರ್ಗಳ','ಮರದ','ಮರ್'],'ಮರಗಳು',['grammar','vachana','set1']),
  mcq('Kannada','ವ್ಯಾಕರಣ – ಕ್ರಿಯಾಪದ','"ಅವನು ಓಡುತ್ತಾನೆ" ಎಂಬ ವಾಕ್ಯದಲ್ಲಿ ಕ್ರಿಯಾಪದ ಯಾವುದು?',['ಅವನು','ಓಡುತ್ತಾನೆ','ಅವ','ಓಡು'],'ಓಡುತ್ತಾನೆ',['grammar','kriyapada','set1']),
  mcq('Kannada','ವ್ಯಾಕರಣ – ಕಾಲ','"ಅವನು ಬಂದನು" ಎಂಬ ವಾಕ್ಯ ಯಾವ ಕಾಲ?',['ವರ್ತಮಾನ','ಭೂತ','ಭವಿಷ್ಯ','ಸಂಭಾವ್ಯ'],'ಭೂತ',['grammar','kaala','set1']),
  mcq('Kannada','ವ್ಯಾಕರಣ – ವಿಭಕ್ತಿ','"ರಾಮನಿಗೆ ಹಣ ಕೊಟ್ಟರು" — "ನಿಗೆ" ವಿಭಕ್ತಿ ಪ್ರತ್ಯಯ ಯಾವ ವಿಭಕ್ತಿ?',['ಪ್ರಥಮಾ','ಷಷ್ಠಿ','ಚತುರ್ಥಿ','ಪಂಚಮಿ'],'ಚತುರ್ಥಿ',['grammar','vibhakti','set1']),
  mcq('Kannada','ವ್ಯಾಕರಣ – ಸಂಧಿ','"ವಿದ್ಯಾರ್ಥಿ" ಪದದಲ್ಲಿ ಸಂಧಿ ಇದೆಯೇ?',['ಇಲ್ಲ','ಹೌದು – ಆಗಮ ಸಂಧಿ','ಹೌದು – ಲೋಪ ಸಂಧಿ','ಹೌದು – ಆದೇಶ ಸಂಧಿ'],'ಹೌದು – ಲೋಪ ಸಂಧಿ',['grammar','sandhi','set1']),
  mcq('Kannada','ವ್ಯಾಕರಣ – ಅಲಂಕಾರ','"ಅವಳ ಮುಖ ಚಂದ್ರನಂತಿದೆ" — ಇದು ಯಾವ ಅಲಂಕಾರ?',['ರೂಪಕ','ಉಪಮಾ','ಅನುಪ್ರಾಸ','ಉತ್ಪ್ರೇಕ್ಷ'],'ಉಪಮಾ',['grammar','alankar','set1']),
  mcq('Kannada','ವ್ಯಾಕರಣ – ಸಮಾಸ','"ರಾಜಪುತ್ರ" ಪದದಲ್ಲಿ ಯಾವ ಸಮಾಸ?',['ತತ್ಪುರುಷ','ದ್ವಂದ್ವ','ಬಹುವ್ರೀಹಿ','ಅವ್ಯಯೀಭಾವ'],'ತತ್ಪುರುಷ',['grammar','samaasa','set1']),

  // Set 2 – ವ್ಯಾಕರಣ: ಛಂದಸ್ಸು, ರಸ, ನುಡಿಗಟ್ಟು (Q11–Q20)
  mcq('Kannada','ವ್ಯಾಕರಣ – ರಸ','ಕಾವ್ಯದಲ್ಲಿ ಒಟ್ಟು ಎಷ್ಟು ರಸಗಳಿವೆ?',['6','7','8','9'],'9',['grammar','rasa','set2']),
  mcq('Kannada','ವ್ಯಾಕರಣ – ರಸ','ಶೃಂಗಾರ ರಸದ ಸ್ಥಾಯಿಭಾವ ಯಾವುದು?',['ಭಯ','ರತಿ','ಶೋಕ','ಉತ್ಸಾಹ'],'ರತಿ',['grammar','rasa','set2']),
  mcq('Kannada','ವ್ಯಾಕರಣ – ಛಂದಸ್ಸು','ಕನ್ನಡ ಕಾವ್ಯದಲ್ಲಿ ಬಳಸಲ್ಪಡುವ ಪ್ರಮುಖ ಛಂದಸ್ಸು:',['ದ್ವಿಪದಿ','ವೃತ್ತ','ಶತಕ','ದ್ವಿಪಾದಿ'],'ವೃತ್ತ',['grammar','chandas','set2']),
  mcq('Kannada','ವ್ಯಾಕರಣ – ನುಡಿಗಟ್ಟು','"ಕೈ ಎತ್ತು" ನುಡಿಗಟ್ಟಿನ ಅರ್ಥ:',['ತಕ್ಷಣ ಒಪ್ಪಿಕೊಳ್ಳು','ಸಹಾಯ ಮಾಡು','ಕ್ಷಮಿಸು','ತ್ಯಜಿಸು'],'ತ್ಯಜಿಸು',['vocabulary','nudigan','set2']),
  mcq('Kannada','ವ್ಯಾಕರಣ – ವಿರುದ್ಧಪದ','"ಬೆಳಕು" ಶಬ್ದದ ವಿರುದ್ಧಾರ್ಥಕ ಪದ:',['ನಿಶ್ಶಬ್ದ','ಕತ್ತಲು','ಶಾಂತಿ','ಆನಂದ'],'ಕತ್ತಲು',['vocabulary','viruddha','set2']),
  mcq('Kannada','ವ್ಯಾಕರಣ – ಸಮಾನಾರ್ಥಕ','"ನೀರು" ಪದದ ಸಮಾನಾರ್ಥಕ ಯಾವುದು?',['ಅಗ್ನಿ','ಜಲ','ಭೂಮಿ','ಆಕಾಶ'],'ಜಲ',['vocabulary','samanartha','set2']),
  mcq('Kannada','ವ್ಯಾಕರಣ – ಅಲಂಕಾರ','"ಕಮಲದ ಮುಖ" ಎಂಬ ಪ್ರಯೋಗ ಯಾವ ಅಲಂಕಾರ?',['ಉಪಮಾ','ರೂಪಕ','ಅನುಪ್ರಾಸ','ಯಮಕ'],'ರೂಪಕ',['grammar','alankar','set2']),
  mcq('Kannada','ವ್ಯಾಕರಣ – ಪ್ರತ್ಯಯ','"ಓಡುವಿಕೆ" ಪದದಲ್ಲಿ ಪ್ರತ್ಯಯ ಯಾವುದು?',['ಓಡು','ವಿಕೆ','ಉವಿಕೆ','ಇಕೆ'],'ವಿಕೆ',['grammar','pratyaya','set2']),
  mcq('Kannada','ವ್ಯಾಕರಣ – ಉಪಸರ್ಗ','"ಅತಿಮಾನುಷ" ಪದದಲ್ಲಿ ಉಪಸರ್ಗ ಯಾವುದು?',['ಅತಿ','ಮಾನ','ಮಾನುಷ','ಹುಷ'],'ಅತಿ',['grammar','upasarga','set2']),
  mcq('Kannada','ವ್ಯಾಕರಣ – ವಾಕ್ಯ ವಿಧ','"ನೀನು ಎಲ್ಲಿಗೆ ಹೋಗುತ್ತಿದ್ದೀಯ?" ಎಂಬ ವಾಕ್ಯ ಯಾವ ವಿಧ?',['ವಿಧ್ಯರ್ಥ','ಪ್ರಶ್ನಾರ್ಥ','ನಿಷೇಧಾರ್ಥ','ಆಶ್ಚರ್ಯಾರ್ಥ'],'ಪ್ರಶ್ನಾರ್ಥ',['grammar','vakya','set2']),

  // Set 3 – ಪದ್ಯ ಮತ್ತು ಗದ್ಯ: 8ನೇ ತರಗತಿ ಪಠ್ಯ (Q21–Q30)
  mcq('Kannada','ಸಾಹಿತ್ಯ','ರಾಷ್ಟ್ರಕವಿ ಕುವೆಂಪು ಅವರ ಪ್ರಸಿದ್ಧ ಕವನ:',['ಮಂಕುತಿಮ್ಮನ ಕಗ್ಗ','ಜಯ ಭಾರತ ಜನನಿಯ ತನುಜಾತೆ','ಗೋಕಾಕ ಗೀತೆ','ನಡೆದಾಡುವ ಮೈಲಿಗಲ್ಲು'],'ಜಯ ಭಾರತ ಜನನಿಯ ತನುಜಾತೆ',['literature','poetry','set3']),
  mcq('Kannada','ಸಾಹಿತ್ಯ','ಕನ್ನಡ ಸಾಹಿತ್ಯದ ಮೊದಲ ಕವಿ ಎಂದು ಪರಿಗಣಿಸಲ್ಪಟ್ಟವರು:',['ಬಸವಣ್ಣ','ಪಂಪ','ರನ್ನ','ಜನ್ನ'],'ಪಂಪ',['literature','history','set3']),
  mcq('Kannada','ಸಾಹಿತ್ಯ','ಕನ್ನಡ ಸಾಹಿತ್ಯದ "ರತ್ನತ್ರಯ" ಯಾರು?',['ಕುವೆಂಪು, ಬೇಂದ್ರೆ, ಕಾರ್ನಾಡ','ಪಂಪ, ರನ್ನ, ಪೊನ್ನ','ಅಕ್ಕ, ಬಸವಣ್ಣ, ಅಲ್ಲಮ','ಮಾಸ್ತಿ, ತರಾಸು, ತ್ರಿವೇಣಿ'],'ಪಂಪ, ರನ್ನ, ಪೊನ್ನ',['literature','history','set3']),
  mcq('Kannada','ಸಾಹಿತ್ಯ','ವಚನ ಸಾಹಿತ್ಯದ ಪ್ರವರ್ತಕ:',['ಪಂಪ','ಬಸವಣ್ಣ','ಕುವೆಂಪು','ಡಿ.ವಿ.ಜಿ.'],'ಬಸವಣ್ಣ',['literature','vachana','set3']),
  mcq('Kannada','ಸಾಹಿತ್ಯ','ಡಿ.ವಿ.ಜಿ. ಯಾರು?',['ಡಿ.ವಿ. ಗುಂಡಪ್ಪ','ಡಿ. ವೆಂಕಟೇಶ ಗೌಡ','ದಿಗ್ವಿಜಯ ಗೌಡ','ದ್ಯಾವಪ್ಪ ವೀರಣ್ಣ ಗೌಡ'],'ಡಿ.ವಿ. ಗುಂಡಪ್ಪ',['literature','set3']),
  mcq('Kannada','ಸಾಹಿತ್ಯ','ಕನ್ನಡ ರಾಜ್ಯೋತ್ಸವ ಆಚರಿಸಲ್ಪಡುವ ದಿನ:',['ಆಗಸ್ಟ್ 15','ನವೆಂಬರ್ 1','ಜನವರಿ 26','ಅಕ್ಟೋಬರ್ 2'],'ನವೆಂಬರ್ 1',['culture','set3']),
  mcq('Kannada','ಸಾಹಿತ್ಯ','ಕನ್ನಡ ಭಾಷೆ ಯಾವ ಲಿಪಿಯನ್ನು ಬಳಸುತ್ತದೆ?',['ದೇವನಾಗರಿ','ತೆಲುಗು ಲಿಪಿ','ಕನ್ನಡ ಲಿಪಿ','ಬ್ರಾಹ್ಮಿ'],'ಕನ್ನಡ ಲಿಪಿ',['language','set3']),
  mcq('Kannada','ವ್ಯಾಕರಣ – ಗಾದೆ','"ಉದ್ಯೋಗಂ ಪುರುಷ ಲಕ್ಷಣಂ" ಗಾದೆಯ ಅರ್ಥ:',['ಆಲಸ್ಯ ಒಳ್ಳೆಯದು','ಕೆಲಸ ಮಾಡುವುದು ಮನುಷ್ಯನ ಲಕ್ಷಣ','ಪ್ರಯಾಣ ಮಾಡಬೇಕು','ಶ್ರೀಮಂತಿಕೆ ಬೇಕು'],'ಕೆಲಸ ಮಾಡುವುದು ಮನುಷ್ಯನ ಲಕ್ಷಣ',['vocabulary','gaade','set3']),
  mcq('Kannada','ಸಾಹಿತ್ಯ','ಅಕ್ಕಮಹಾದೇವಿ ಯಾವ ಮತದ ಭಕ್ತಿ ಸಾಹಿತ್ಯ ರಚಿಸಿದರು?',['ವೈಷ್ಣವ','ಶೈವ','ಬೌದ್ಧ','ಜೈನ'],'ಶೈವ',['literature','bhakti','set3']),
  mcq('Kannada','ಸಾಹಿತ್ಯ','ಕನ್ನಡ ರಾಜ್ಯ ಸ್ಥಾಪನೆ ಯಾವ ವರ್ಷ?',['1947','1950','1956','1960'],'1956',['history','set3']),

  // Set 4 – Mixed Grammar + Literature + Applied (Q31–Q40)
  mcq('Kannada','ವ್ಯಾಕರಣ – ಶಬ್ದ ರೂಪ','"ಹೋಗು" ಕ್ರಿಯಾಪದದ ಭೂತಕಾಲ ರೂಪ:',['ಹೋಗುತ್ತಾನೆ','ಹೋದನು','ಹೋಗುವನು','ಹೋಗು'],'ಹೋದನು',['grammar','rupa','set4']),
  mcq('Kannada','ವ್ಯಾಕರಣ','ಕನ್ನಡ ವರ್ಣಮಾಲೆಯಲ್ಲಿ ಸ್ವರಗಳ ಸಂಖ್ಯೆ:',['10','13','16','18'],'13',['grammar','varna','set4']),
  mcq('Kannada','ವ್ಯಾಕರಣ – ವಿಸರ್ಗ ಸಂಧಿ','"ದುಃಖ" ಪದದಲ್ಲಿ ಯಾವ ಚಿಹ್ನೆ ಇದೆ?',['ಅನುಸ್ವಾರ','ವಿಸರ್ಗ','ಅಘೋಷ','ಆಗಮ'],'ವಿಸರ್ಗ',['grammar','set4']),
  mcq('Kannada','ಸಾಹಿತ್ಯ','ಕನ್ನಡ ಸಾಹಿತ್ಯ ಪರಿಷತ್ ಸ್ಥಾಪನೆ ಯಾವ ವರ್ಷ?',['1900','1915','1920','1947'],'1915',['literature','organization','set4']),
  mcq('Kannada','ಸಾಹಿತ್ಯ','ಜ್ಞಾನಪೀಠ ಪ್ರಶಸ್ತಿ ಪಡೆದ ಮೊದಲ ಕನ್ನಡ ಸಾಹಿತಿ:',['ಕುವೆಂಪು','ದಾ.ರಾ. ಬೇಂದ್ರೆ','ಮಾಸ್ತಿ ವೆಂಕಟೇಶ ಅಯ್ಯಂಗಾರ','ಶಿವರಾಮ ಕಾರಂತ'],'ಕುವೆಂಪು',['literature','awards','set4']),
  mcq('Kannada','ವ್ಯಾಕರಣ – ಲಿಂಗ ಪರಿವರ್ತನೆ','"ರಾಜ" ಶಬ್ದದ ಸ್ತ್ರೀಲಿಂಗ:',['ರಾಣಿ','ರಾಜಿ','ರಾಜ್ಞೀ','ರಾಜೆ'],'ರಾಣಿ',['grammar','linga','set4']),
  mcq('Kannada','ವ್ಯಾಕರಣ – ಏಕವಚನ','"ಮಕ್ಕಳು" ಪದದ ಏಕವಚನ:',['ಮಕ್ಕಳ','ಮಗು','ಮಗ','ಮಗಳು'],'ಮಗು',['grammar','vachana','set4']),
  mcq('Kannada','ಸಾಹಿತ್ಯ','ಕನ್ನಡ ನಾಡಗೀತೆ ರಚಿಸಿದವರು:',['ಕುವೆಂಪು','ಹುಯಿಲಗೋಳ ನಾರಾಯಣ ರಾವ್','ಬಿ.ಎಂ. ಶ್ರೀ','ಬೇಂದ್ರೆ'],'ಹುಯಿಲಗೋಳ ನಾರಾಯಣ ರಾವ್',['literature','nadageethe','set4']),
  mcq('Kannada','ವ್ಯಾಕರಣ – ಸಮಾಸ','"ತ್ರಿಭುವನ" ಪದದಲ್ಲಿ ಯಾವ ಸಮಾಸ?',['ತತ್ಪುರುಷ','ದ್ವಿಗು','ದ್ವಂದ್ವ','ಬಹುವ್ರೀಹಿ'],'ದ್ವಿಗು',['grammar','samaasa','set4']),
  mcq('Kannada','ಸಾಹಿತ್ಯ','ಕರ್ನಾಟಕ ರಾಜ್ಯ ಪ್ರಶಸ್ತಿ "ಪಂಪ ಪ್ರಶಸ್ತಿ" ಯಾವ ಕ್ಷೇತ್ರದಲ್ಲಿ ಕೊಡಲ್ಪಡುತ್ತದೆ?',['ಕ್ರೀಡೆ','ಚಲನಚಿತ್ರ','ಕನ್ನಡ ಸಾಹಿತ್ಯ','ವಿಜ್ಞಾನ'],'ಕನ್ನಡ ಸಾಹಿತ್ಯ',['literature','awards','set4']),
];

// ── COMPUTER SCIENCE ──────────────────────────────────────────────────────────
const CS_Q: Q[] = [
  // Set 1 – Hardware, Software, Memory (Q1–Q10)
  mcq('Computer Science','Hardware and Software','The brain of the computer is the:',['RAM','Monitor','CPU','Hard disk'],'CPU',['hardware','set1']),
  mcq('Computer Science','Hardware and Software','Which of the following is an Input device?',['Monitor','Speaker','Keyboard','Printer'],'Keyboard',['hardware','set1']),
  mcq('Computer Science','Hardware and Software','RAM stands for:',['Read Access Memory','Random Access Memory','Rapid Access Memory','Remote Access Memory'],'Random Access Memory',['hardware','memory','set1']),
  mcq('Computer Science','Hardware and Software','ROM is:',['Volatile memory','Non-volatile memory','Input device','Output device'],'Non-volatile memory',['hardware','memory','set1']),
  mcq('Computer Science','Hardware and Software','1 GB = ?',['1000 MB','1024 MB','512 MB','2048 MB'],'1024 MB',['hardware','units','set1']),
  mcq('Computer Science','Software','System software that manages computer resources is called:',['Application software','Operating System','Database','Compiler'],'Operating System',['software','set1']),
  mcq('Computer Science','Software','Microsoft Word is an example of:',['System software','Operating system','Application software','Utility software'],'Application software',['software','set1']),
  mcq('Computer Science','Software','Which is NOT an operating system?',['Windows','Linux','Android','MS Word'],'MS Word',['software','os','set1']),
  mcq('Computer Science','Number Systems','Binary number 1010 in decimal is:',['8','10','12','14'],'10',['numbers','binary','set1']),
  mcq('Computer Science','Number Systems','Decimal 15 in binary is:',['1111','1100','1010','1001'],'1111',['numbers','binary','set1']),

  // Set 2 – Internet, Networks, Cybersecurity (Q11–Q20)
  mcq('Computer Science','Internet','WWW stands for:',['World Wide Web','World Wide Wire','Wide World Web','World Web Wires'],'World Wide Web',['internet','set2']),
  mcq('Computer Science','Internet','HTTP stands for:',['HyperText Transfer Protocol','High Transfer Text Protocol','HyperText Transport Program','High Text Transfer Procedure'],'HyperText Transfer Protocol',['internet','protocols','set2']),
  mcq('Computer Science','Internet','A unique address that identifies a website is called:',['IP address','URL','HTML','CSS'],'URL',['internet','set2']),
  mcq('Computer Science','Networking','LAN stands for:',['Large Area Network','Local Area Network','Long Area Network','Linked Area Network'],'Local Area Network',['networking','set2']),
  mcq('Computer Science','Networking','Which device connects two different networks?',['Hub','Switch','Router','Repeater'],'Router',['networking','set2']),
  mcq('Computer Science','Cybersecurity','A program that replicates itself and spreads to other computers is called:',['Bug','Virus','Firewall','Browser'],'Virus',['security','set2']),
  mcq('Computer Science','Cybersecurity','The best protection against unauthorized computer access is:',['Antivirus','Firewall','Strong password','All of these'],'All of these',['security','set2']),
  mcq('Computer Science','Internet','Email stands for:',['Electric mail','Electronic mail','Efficient mail','External mail'],'Electronic mail',['internet','set2']),
  mcq('Computer Science','Internet','Which search engine is most commonly used?',['Bing','Yahoo','Google','DuckDuckGo'],'Google',['internet','set2']),
  mcq('Computer Science','Networking','WiFi uses which type of medium to transmit data?',['Coaxial cable','Optical fibre','Wireless radio waves','Copper wire'],'Wireless radio waves',['networking','set2']),

  // Set 3 – HTML & Web Design (Q21–Q30)
  mcq('Computer Science','HTML','HTML stands for:',['Hyper Text Markup Language','High Transfer Markup Language','Hyper Transfer Machine Language','Hyper Text Machine Link'],'Hyper Text Markup Language',['html','web','set3']),
  mcq('Computer Science','HTML','The correct HTML tag for the largest heading is:',['<h6>','<heading>','<h1>','<head>'],'<h1>',['html','tags','set3']),
  mcq('Computer Science','HTML','Which tag is used to create a hyperlink in HTML?',['<link>','<href>','<a>','<url>'],'<a>',['html','tags','set3']),
  mcq('Computer Science','HTML','The HTML tag for inserting an image is:',['<picture>','<img>','<image>','<photo>'],'<img>',['html','tags','set3']),
  mcq('Computer Science','HTML','Which tag creates an unordered (bulleted) list?',['<ol>','<dl>','<ul>','<li>'],'<ul>',['html','tags','set3']),
  mcq('Computer Science','HTML','The <br> tag is used for:',['Bold text','Line break','Background color','Border'],'Line break',['html','tags','set3']),
  mcq('Computer Science','HTML','CSS stands for:',['Computer Style Sheets','Creative Style Sheets','Cascading Style Sheets','Colorful Style Sheets'],'Cascading Style Sheets',['html','css','set3']),
  mcq('Computer Science','HTML','Which attribute gives background colour to a webpage body?',['color','bgcolor','background','style'],'bgcolor',['html','attributes','set3']),
  mcq('Computer Science','HTML','The tag used to make text bold in HTML is:',['<i>','<u>','<b>','<s>'],'<b>',['html','tags','set3']),
  mcq('Computer Science','HTML','HTML documents must have the root tag:',['<html>','<head>','<body>','<title>'],'<html>',['html','structure','set3']),

  // Set 4 – Spreadsheets, Databases, Programming Concepts (Q31–Q40)
  mcq('Computer Science','Spreadsheet','In Excel/Spreadsheet, a cell address A1 means:',['Row A, Column 1','Column A, Row 1','First cell of sheet 1','Cell named A1'],'Column A, Row 1',['spreadsheet','set4']),
  mcq('Computer Science','Spreadsheet','The formula to add values from A1 to A5 in Excel is:',['=ADD(A1:A5)','=SUM(A1,A5)','=SUM(A1:A5)','=TOTAL(A1:A5)'],'=SUM(A1:A5)',['spreadsheet','formula','set4']),
  mcq('Computer Science','Spreadsheet','Which function finds the largest value in a range?',['=MIN()','=MAX()','=AVERAGE()','=COUNT()'],'=MAX()',['spreadsheet','formula','set4']),
  mcq('Computer Science','Database','A collection of related data organised for easy access is called a:',['Spreadsheet','Database','Presentation','Browser'],'Database',['database','set4']),
  mcq('Computer Science','Database','Rows in a database table are called:',['Fields','Columns','Records','Tables'],'Records',['database','set4']),
  mcq('Computer Science','Programming','What is an algorithm?',['A computer language','Step-by-step instructions to solve a problem','A type of software','A hardware component'],'Step-by-step instructions to solve a problem',['programming','algorithm','set4']),
  mcq('Computer Science','Programming','A flowchart uses which shape for a decision?',['Rectangle','Circle','Diamond','Oval'],'Diamond',['programming','flowchart','set4']),
  mcq('Computer Science','Programming','Which programming language is best for beginners?',['Assembly','C++','Python','COBOL'],'Python',['programming','languages','set4']),
  mcq('Computer Science','Programming','A variable in programming is:',['A fixed value','A named storage location that can change','A loop','A function'],'A named storage location that can change',['programming','basics','set4']),
  mcq('Computer Science','AI and Future Tech','Artificial Intelligence (AI) refers to:',['Robots only','Machines simulating human intelligence','Internet connectivity','Cloud storage'],'Machines simulating human intelligence',['ai','future','set4']),
];

// ─────────────────────────────────────────────────────────────────────────────
// TEST SETS DEFINITION
// ─────────────────────────────────────────────────────────────────────────────

interface TestDef {
  subject: string;
  sets: { title: string; description: string; qRange: [number, number] }[];
}

function testDefs(subject: string, board: string): TestDef {
  return {
    subject,
    sets: [
      {
        title: `${subject} – Set 1 (Term 1, First Half) [${board}]`,
        description: `Medium difficulty test covering ${subject} Term 1 first half topics for 8th Standard.`,
        qRange: [0, 9],
      },
      {
        title: `${subject} – Set 2 (Term 1, Second Half) [${board}]`,
        description: `Medium difficulty test covering ${subject} Term 1 second half topics for 8th Standard.`,
        qRange: [10, 19],
      },
      {
        title: `${subject} – Set 3 (Term 2, First Half) [${board}]`,
        description: `Medium difficulty test covering ${subject} Term 2 first half topics for 8th Standard.`,
        qRange: [20, 29],
      },
      {
        title: `${subject} – Set 4 (Term 2 / Revision) [${board}]`,
        description: `Revision test covering ${subject} full year topics for 8th Standard.`,
        qRange: [30, 39],
      },
    ],
  };
}

const TEST_PLAN: { bank: Q[]; def: TestDef }[] = [
  { bank: MATH_Q,     def: testDefs('Mathematics',      'Karnataka Board / CBSE') },
  { bank: SCIENCE_Q,  def: testDefs('Science',          'Karnataka Board / CBSE') },
  { bank: SOC_Q,      def: testDefs('Social Science',   'Karnataka Board / CBSE') },
  { bank: ENGLISH_Q,  def: testDefs('English',          'Karnataka Board / CBSE') },
  { bank: HINDI_Q,    def: testDefs('Hindi',            'CBSE / Karnataka Board') },
  { bank: KANNADA_Q,  def: testDefs('Kannada',          'Karnataka Board') },
  { bank: CS_Q,       def: testDefs('Computer Science', 'Karnataka Board / CBSE') },
];

// ─────────────────────────────────────────────────────────────────────────────
// SEED RUNNER
// ─────────────────────────────────────────────────────────────────────────────

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error'] });
  const ds  = app.get(DataSource);

  const userRepo  = ds.getRepository(User);
  const classRepo = ds.getRepository(Class);
  const qRepo     = ds.getRepository(Question);
  const testRepo  = ds.getRepository(TestEntity);

  // ── Find teacher ─────────────────────────────────────────────────────────
  const teacher = await userRepo.findOne({ where: { phone: TEACHER_PHONE } });
  if (!teacher) {
    console.error(`❌  Teacher with phone ${TEACHER_PHONE} not found. Run db:seed:demo first.`);
    await app.close();
    process.exit(1);
  }
  const institutionId = teacher.institution_id as string;
  console.log(`✓  Found teacher: ${teacher.name} (${teacher.phone})`);

  // ── Find 8th standard class (8-A) ────────────────────────────────────────
  const class8A = await classRepo.findOne({
    where: { institution_id: institutionId, name: 'Class 8', section: 'A' },
  });
  if (!class8A) {
    console.error('❌  Class 8-A not found. Run db:seed:demo first.');
    await app.close();
    process.exit(1);
  }
  console.log(`✓  Found class: ${class8A.name}-${class8A.section}`);

  // ── Reset if requested ────────────────────────────────────────────────────
  if (RESET) {
    process.stdout.write('  Removing existing 8th-std test data...');
    const existingTests = await testRepo.find({
      where: { institution_id: institutionId, class_id: class8A.id, created_by: teacher.id },
    });
    if (existingTests.length) {
      await testRepo.remove(existingTests);
    }
    const existingQs = await qRepo.find({
      where: { institution_id: institutionId, created_by: teacher.id },
    });
    if (existingQs.length) {
      await qRepo.remove(existingQs);
    }
    console.log(' done.');
  }

  // ── Seed each subject ─────────────────────────────────────────────────────
  let totalQ = 0;
  let totalT = 0;

  for (const { bank, def } of TEST_PLAN) {
    process.stdout.write(`  [${def.subject}] Creating questions...`);

    const savedQs: Question[] = [];
    for (const q of bank) {
      const entity = qRepo.create({
        institution_id: institutionId,
        created_by:     teacher.id,
        subject:        q.subject,
        topic:          q.topic,
        question_text:  q.question_text,
        type:           QuestionType.MCQ,
        options:        q.options,
        correct_answer: q.correct_answer,
        difficulty:     DifficultyLevel.MEDIUM,
        tags:           q.tags,
        is_active:      true,
      } as any);
      savedQs.push(await qRepo.save(entity) as unknown as Question);
    }
    totalQ += savedQs.length;
    console.log(` ${savedQs.length} questions saved.`);

    process.stdout.write(`  [${def.subject}] Creating 4 test sets...`);
    for (const set of def.sets) {
      const [from, to] = set.qRange;
      const qIds = savedQs.slice(from, to + 1).map((q) => q.id);

      const test = testRepo.create({
        institution_id:   institutionId,
        created_by:       teacher.id,
        class_id:         class8A.id,
        title:            set.title,
        description:      set.description,
        subject:          def.subject,
        question_ids:     qIds,
        total_marks:      qIds.length,
        duration_minutes: 30,
        status:           TestStatus.PUBLISHED,
      } as any);
      await testRepo.save(test);
      totalT++;
    }
    console.log(' done.');
  }

  console.log(`\n✅  Seeding complete!`);
  console.log(`   Questions created : ${totalQ}`);
  console.log(`   Tests created     : ${totalT}`);
  console.log(`   Teacher           : ${teacher.name} (${TEACHER_PHONE})`);
  console.log(`   Class             : 8-A, ${institutionId}`);

  await app.close();
}

seed().catch((err) => { console.error(err); process.exit(1); });
