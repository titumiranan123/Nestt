export type HomePageImageCard = {
  title: string;
  description: string;
  image: string;
  action: string;
};

export const homePageRoomLinks = [
  { name: "Living Room", image: "/assets/figma-home/room-living.png" },
  { name: "Bedroom", image: "/assets/figma-home/room-bedroom.png" },
  { name: "Dining Room", image: "/assets/figma-home/room-dining.png" },
  { name: "Home Office", image: "/assets/figma-home/room-office.png" },
];

export const homePageExperienceCards: HomePageImageCard[] = [
  { title: "See Every Detail", description: "Explore every detail, visualize furniture in your space, and discover your perfect fit before you buy.", image: "/assets/figma-home/feature-detail.png", action: "Explore" },
  { title: "See It in Your Space", description: "Visualize furniture in your room before making a decision.", image: "/assets/figma-home/feature-ar.png", action: "Try AR" },
  { title: "Step Into Your Dream Home", description: "Explore an immersive virtual showroom from anywhere.", image: "/assets/figma-home/feature-showroom.png", action: "Explore" },
  { title: "We're Here to Help", description: "Get expert advice and answers to your questions in real time.", image: "/assets/figma-home/feature-help.png", action: "Explore" },
];

export const homePageFitSpaces = [
  { name: "Japandi Modern", description: "Low profile & blonde beech", image: "/assets/figma-home/fit-japandi.png" },
  { name: "Mid-Century Modern", description: "Dark oak & cognac saddle leather", image: "/assets/figma-home/fit-midcentury.png" },
  { name: "Urban Minimalist", description: "Clean geometry & woven linen", image: "/assets/figma-home/fit-minimal.png" },
];

export const homePageServiceBenefits = [
  { title: "White-Glove Assembly", description: "Nationwide delivery with hassle-free installation by certified Nestt technicians." },
  { title: "Easy 14-Day Returns", description: "Evaluate scale in your actual setting. If it doesn’t align, enjoy a quick pickup and support." },
  { title: "0% EMI Financing", description: "Convenient zero-interest monthly installment up to 24 months through 35+ partner banks." },
  { title: "10-Year Warranty", description: "Guaranteed protection against solid wood seasoning defects, pest infestation, and joint failure." },
];

export const homePageTestimonials = [
  { quote: "The robotic joinery on the Kyoto extendable dining table is flawless. You cannot see or feel any gaps. Delivery team in Gulshan completed setup in under 20 minutes.", name: "Tarik Siddiqui", location: "Architect · Studio Architect" },
  { quote: "Tested our living room layout using Nestt’s WebAR feature beforehand. When the actual Sylvan hydraulic bed and sofa arrived, the scale and timber tone matched 1:1.", name: "Nadia Mansoor", location: "Banasree Residence, Dhaka" },
  { quote: "Nestt defines modern furniture excellence in the country. Four years after purchase, our executive writing desk still looks crisp, sturdy, and immaculate.", name: "Rehan Ahmed", location: "Design Director · Minimalist Labs" },
];
