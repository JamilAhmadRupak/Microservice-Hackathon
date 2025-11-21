const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">CareForAll</h3>
            <p className="text-gray-400">
              A platform connecting donors with those in need. Together we make a difference.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-gray-400">
              <li><a href="/campaigns" className="hover:text-white">Browse Campaigns</a></li>
              <li><a href="/campaigns/create" className="hover:text-white">Start Campaign</a></li>
              <li><a href="/about" className="hover:text-white">About Us</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <p className="text-gray-400">Email: support@careforall.com</p>
            <p className="text-gray-400">Phone: +880 1712-345678</p>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-gray-400">
          <p>&copy; 2025 CareForAll - Api Avengers. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
