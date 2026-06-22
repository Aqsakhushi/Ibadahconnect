import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { FaStar } from 'react-icons/fa';

const ServiceDetailPage = ({ openAuthModal }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const [qty, setQty] = useState(1);

  // Services Data with Detailed FAQs
  const servicesData = {
    'umrah-1': {
      name: "Umrah Badal", price: 50000, img: "/images/noor.jpg", btn: "Book Umrah Badal", isCart: false,
      desc: "Our Umrah Badal service makes it easy to fulfill the obligation of Umrah for those unable to perform it themselves. From start to finish, we handle everything with care, providing updates throughout the process and video confirmation after the Umrah has been completed.",
      faqs: [
        { q: "What is Umrah Badal?", a: "Umrah Badal is the act of performing Umrah on behalf of someone who is unable to do so themselves. This could be due to reasons such as illness, age, or even death. It allows the individual who cannot perform Umrah to receive the spiritual benefits of the pilgrimage through the good deed performed by someone else on their behalf." },
        { q: "Can Umrah Badal be carried out for the deceased?", a: "Yes, Umrah Badal can be performed on behalf of a deceased person. It is a recommended practice to perform Umrah for someone who has passed away, especially if they had intended to perform the pilgrimage but were unable to do so due to illness, financial constraints, or other reasons. The person performing the Umrah Badal on behalf of the deceased will complete all the rituals of Umrah with the intention of fulfilling the deceased’s obligation, ensuring that they receive the spiritual rewards." },
        { q: "Is this permissible?", a: "Yes, performing Umrah Badal on behalf of someone who has passed away is permissible in Islam. It is widely accepted by Islamic scholars and jurisprudence. The practice is based on the principle that acts of worship, including Umrah, can be performed on behalf of others, especially for the deceased." },
        { q: "What is the evidence?", a: "A well-known hadith that supports performing Hajj or Umrah on behalf of the deceased is: Ibn Abbas reported that a woman from the Juhaina tribe came to the Prophet ﷺ and said: 'My mother had vowed to perform Hajj but she died before fulfilling it. Should I perform Hajj on her behalf?' The Prophet ﷺ replied: 'Yes, perform Hajj on her behalf. If your mother had a debt, would you not pay it off? Fulfill her debt to Allah, for Allah is more deserving of payment.' (Sahih al-Bukhari, Hadith 1852). Another hadith: Aisha narrated that a man asked the Prophet ﷺ if he could perform Hajj on behalf of his father, who had passed away. The Prophet ﷺ replied: 'If your father had a debt, would you not pay it off? So, the debt owed to Allah is more deserving to be paid off.' (Sunan Ibn Majah)" },
        { q: "Is it obligatory to do Umrah for the deceased if they didn’t perform it in their lifetime?", a: "There are two main views on this matter: The First View: According to Shafi’i and Hanbali scholars, it is obligatory to perform Umrah on behalf of the deceased, regardless of whether the deceased has made a bequest for it. The Second View: A different group of scholars holds that performing Umrah on behalf of the deceased is not obligatory unless the deceased explicitly bequeaths it. This opinion is followed by Hanafi and Maliki scholars. According to these schools, performing Umrah is sunnah and mustahabb (recommended), but not obligatory." },
        { q: "Can Umrah Badal be performed for the living?", a: "Yes, Umrah Badal can be performed on behalf of a living person who is unable to perform Umrah due to reasons such as illness, old age, or any other valid excuse. The individual performing the Umrah on behalf of the living person must do so with the intention (niyyah) that the reward of the pilgrimage will go to the person they are representing. Ibn Qudamah (a well-known Islamic scholar) mentioned in his book Al-Mughni that it is permissible to perform Hajj or Umrah on behalf of someone who is living and unable to do so due to a legitimate reason." },
        { q: "How does the reward reach another person?", a: "The reward from Umrah Badal performed on behalf of a living person reaches them through the concept of Isāl al-Thawāb (Arabic: إيصال الثواب) which translates to 'conveying the reward' or 'sending the reward'. It is also referred to as Ihdā’ al-Thawāb (Arabic: إهداء الثواب), which literally means 'to gift the reward.' These terms are used to describe the act of dedicating the reward of good deeds, like performing Hajj, Umrah, or giving charity, to someone else — whether living or deceased." },
        { q: "Can Umrah or other virtuous acts be performed on behalf of the Prophet ﷺ?", a: "The famous scholar Ibn ‘Abidin in his book Radd ul Mukhtar (volume 1, page 845) said: 'Do you not see that after the Prophet’s ﷺ passing, Ibn Umar performed Umrah for the Prophet ﷺ [all through the rest of his life]? Ibn Mowfiq, who has the same rank as Junayd (as a gnostic), performed 70 Hajj on behalf of the Prophet ﷺ, and Ibn Siraj recited the Quran 10,000 times for the Prophet ﷺ, and did the same number of adhiyas (sacrifices of an animal).'" },
        { q: "How can I book Umrah Badal?", a: "To place an order for Umrah Badal, follow these simple steps: 1. Select Your Service: Choose Umrah Badal and specify the details. 2. Provide Details: Enter any additional information, such as specific du’as. 3. Make Payment: Proceed to the secure payment gateway. 4. Receive Confirmation: Once your order is processed, you will receive a confirmation email. 5. Completion: Video evidence of the Umrah being performed will be sent to you." },
        { q: "Who will be performing the Umrah?", a: "In most cases, students of knowledge who reside and study in Makkah, perform the Umrah Badal on behalf of others. The student appointed to perform Umrah on your behalf will benefit from the funds they receive, as it helps them support themselves and their family while continuing their studies in Makkah. Thus, your contribution not only ensures that the Umrah Badal is carried out properly but also provides support to a dedicated student of knowledge, enabling them to continue their religious education, bringing a double reward to you." },
        { q: "When will you carry out the Umrah?", a: "The Umrah will typically be performed on Saturdays, but please note that during busy periods like Ramadan, the timing may vary due to increased demand and availability. While we aim to carry out the Umrah as soon as possible, it cannot always be guaranteed to take place on the specified day during such peak times. Rest assured, we will keep you informed of any updates regarding the scheduling of your Umrah Badal." },
        { q: "Can I make special requests?", a: "Yes, you can make special requests when placing your Umrah Badal order. Whether it’s a specific du’a you’d like to be made during the Umrah or any other personal preferences, we aim to accommodate your needs as much as possible. Simply provide the details of your requests during the order process, and our team will ensure they are included while performing the Umrah on your behalf. If you have any specific instructions, please let us know." },
        { q: "What will I receive after the Umrah is performed?", a: "Upon completion, you will receive a video of the student performing the various rituals of Umrah Badal on your behalf. The video will include the following key rituals: 1. Niyyah (intention) for the Umrah. 2. Tawaf (circumambulation of the Ka’bah). 3. Sa'i (walking between Safa and Marwah). 4. Halq (haircut, or shaving/cutting of the hair)." }
      ]
    },
    'hajj-badal': {
      name: "Hajj Badal", price: 300000, img: "/images/hajj.jpg", btn: "Book Hajj Badal", isCart: false,
      desc: "Fulfill the ultimate pillar of Islam on behalf of your deceased loved ones with complete Shariah compliance and video proof.",
      faqs: [{ q: "What is Hajj Badal?", a: "Performing Hajj on behalf of someone who is unable to do so due to illness or death." }]
    },
    'wheelchair': {
      name: "Wheelchair Donation", price: 25000, img: "/images/wheelchair.jpg", btn: "Add to Cart", isCart: true,
      desc: "Donate a wheelchair to Masjid al-Haram or Masjid an-Nabawi on behalf of the deceased. Sadaqah Jariyah.",
      faqs: [{ q: "How does it work?", a: "We purchase a wheelchair on your behalf and donate it to the mosque authorities." }]
    },
    'roza-kushai': {
      name: "Roza Kushai (Iftar)", price: 5000, img: "/images/roza.jpg", btn: "Add to Cart", isCart: true,
      desc: "Arrange Iftar for a fasting person in the Two Holy Mosques on behalf of your marhoom.",
      faqs: [{ q: "What is included?", a: "Dates, water, and a basic meal for one fasting person." }]
    },
    'tasbeeh': {
      name: "Tasbeeh Distribution", price: 4000, img: "/images/tasbeeh.jpg", btn: "Add to Cart", isCart: true,
      desc: "Distribute prayer beads (Tasbeeh) to worshippers in Haram.",
      faqs: [{ q: "How many tasbeehs?", a: "10 pieces of high-quality prayer beads distributed on your behalf." }]
    },
    'zamzam': {
      name: "Ab-e-Zamzam Delivery", price: 8000, img: "/images/zamzam.jpg", btn: "Add to Cart", isCart: true,
      desc: "Arrange pure Zamzam water to be distributed to the poor or delivered to the deceased's family.",
      faqs: [{ q: "Quantity?", a: "5 Liters of pure Zamzam water." }]
    }
  };

  const service = servicesData[id] || servicesData['umrah-1'];
  const totalPrice = service.price * qty;

  const handleBookClick = () => {
    if (!user) {
      openAuthModal();
    } else {
      navigate(`/checkout/${id}`); // Checkout page pe jao
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="pt-10 pb-16 px-6 max-w-6xl mx-auto">
        
        <div className="text-sm text-gray-500 mb-8">
          <Link to="/dashboard" className="hover:text-primary">Dashboard</Link> <span className="mx-2">/</span> <span className="text-gray-900">{service.name}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start mb-16">
          
          {/* Image */}
          <div className="relative h-[400px] md:h-[500px] rounded-3xl overflow-hidden shadow-xl bg-gray-100">
            <img src={service.img} alt={service.name} className="w-full h-full object-cover" />
          </div>

          {/* Details */}
          <div className="bg-white p-8 md:p-10 rounded-3xl shadow-md border border-gray-100">
            <h1 className="text-4xl font-extrabold text-primary mb-4" style={{ fontFamily: 'Amiri, serif' }}>{service.name}</h1>
            
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl font-extrabold text-gray-900">PKR {service.price.toLocaleString()}</span>
              <span className="bg-green-100 text-green-600 text-xs font-bold px-3 py-1 rounded-full">In Stock</span>
            </div>

            <div className="flex items-center gap-2 mb-6">
              <div className="flex text-accent"><FaStar /><FaStar /><FaStar /><FaStar /><FaStar /></div>
              <span className="text-sm text-gray-500">(3 customer reviews)</span>
            </div>
            
            <p className="text-gray-600 leading-relaxed mb-8 border-b border-gray-100 pb-6">{service.desc}</p>

            {/* Add to Cart UI (Quantity Selector) */}
            {service.isCart && (
              <div className="mb-6">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Quantity</label>
                <div className="flex items-center gap-4 w-full">
                  <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-200 text-2xl font-bold text-gray-600 hover:bg-gray-100">-</button>
                  <input type="number" value={qty} readOnly className="w-20 h-12 text-center text-xl font-bold rounded-xl bg-gray-50 border border-gray-200" />
                  <button onClick={() => setQty(qty + 1)} className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-200 text-2xl font-bold text-gray-600 hover:bg-gray-100">+</button>
                </div>
              </div>
            )}

            <div className="bg-gray-50 p-4 rounded-xl flex justify-between items-center mb-6">
              <span className="text-sm font-semibold text-gray-500">Total Amount:</span>
              <span className="text-2xl font-extrabold text-primary">PKR {totalPrice.toLocaleString()}</span>
            </div>

            <button onClick={handleBookClick} className={`w-full font-bold py-4 rounded-xl transition-all duration-300 text-lg shadow-md ${service.isCart ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-accent text-white hover:bg-accent/90'}`}>
              {service.btn}
            </button>
          </div>
        </div>

        {/* --- FAZEELAT (Virtues) SECTION --- */}
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-md border border-gray-100 mb-16 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden shadow-lg">
              <img src="https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?q=80&w=800&auto=format&fit=crop" alt="Makkah" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/20"></div>
            </div>
            <div>
              <h2 className="text-3xl font-extrabold text-primary mb-4" style={{ fontFamily: 'Amiri, serif' }}>The Virtues (Fazeelat)</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Performing acts of worship on behalf of the deceased carries immense rewards. It is a means of continuous charity (Sadaqah Jariyah) for both the living and the dead.
              </p>
              <div className="bg-gray-50 border-l-4 border-accent p-4 rounded-r-xl">
                <p className="text-sm text-gray-700 italic">
                  "When a man dies, his acts come to an end, except three: recurring charity, or knowledge (by which people) benefit, or a pious child, who prays for him (for the deceased)."
                </p>
                <p className="text-xs text-gray-400 mt-2 font-bold">— Sahih Muslim 1631</p>
              </div>
            </div>
          </div>
        </div>

        {/* Description & FAQs Section (Poora Text Yahan Aayega) */}
        <div className="bg-white p-8 md:p-12 rounded-3xl shadow-md border border-gray-100 mb-16">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-8 border-b pb-4" style={{ fontFamily: 'Amiri, serif' }}>Description & FAQs</h2>
          <div className="space-y-8">
            {service.faqs.map((faq, idx) => (
              <div key={idx} className="border-b border-gray-100 pb-6">
                <h3 className="text-xl font-bold text-primary mb-3">{faq.q}</h3>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetailPage;