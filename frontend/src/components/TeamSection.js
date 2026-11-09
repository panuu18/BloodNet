import React from 'react';
import { motion } from 'framer-motion';
import { 
  UserGroupIcon,
  CircleStackIcon,
  PaintBrushIcon,
  DocumentCheckIcon
} from '@heroicons/react/24/outline';
import Card from './ui/Card';

const TeamSection = () => {
  const getMemberColorClasses = (color) => {
    switch (color) {
      case 'red':
        return {
          bg: 'bg-red-50',
          hoverBg: 'group-hover:bg-red-100',
          badge: 'bg-red-500'
        };
      case 'blue':
        return {
          bg: 'bg-blue-50',
          hoverBg: 'group-hover:bg-blue-100',
          badge: 'bg-blue-500'
        };
      default:
        return {
          bg: 'bg-gray-50',
          hoverBg: 'group-hover:bg-gray-100',
          badge: 'bg-gray-500'
        };
    }
  };

  const teamMembers = [
    {
      name: "Rohit Sharad Sanas",
      role: "Full Stack Developer",
      description: "Frontend, Backend Integration, UI Design, Project Architecture",
      icon: <UserGroupIcon className="h-12 w-12 text-red-400" />,
      color: "red"
    },
    {
      name: "Vighnesh N. Suryawanshi",
      role: "Backend Developer",
      description: "API Development, Database Design, Authentication System",
      icon: <CircleStackIcon className="h-12 w-12 text-red-500" />,
      color: "red"
    },
    {
      name: "Rohit Ganesh Sanas",
      role: "Frontend Developer",
      description: "UI Components, Responsiveness, Animations",
      icon: <PaintBrushIcon className="h-12 w-12 text-red-600" />,
      color: "red"
    },
    {
      name: "Manish Rajesh Bodake",
      role: "Testing & Documentation",
      description: "Testing, Debugging, Report Preparation",
      icon: <DocumentCheckIcon className="h-12 w-12 text-red-300" />,
      color: "red"
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-red-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header - matching Why Choose BloodNet+ pattern */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Team Contributions
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Meet the talented team behind BloodNet+, dedicated to saving lives through innovative technology and compassionate service
          </p>
        </motion.div>

        {/* Team Cards Grid - matching Why Choose BloodNet+ pattern */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {teamMembers.map((member, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group"
            >
              <Card className="text-center p-6 h-full">
                <motion.div
                  className="flex justify-center mb-4"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className={`p-3 ${getMemberColorClasses(member.color).bg} rounded-xl ${getMemberColorClasses(member.color).hoverBg} transition-colors`}>
                    {member.icon}
                  </div>
                </motion.div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                  {member.name}
                </h3>
                <div className="mb-3">
                  <span className={`inline-block px-2 py-1 ${getMemberColorClasses(member.color).badge} text-white text-xs font-semibold rounded-full`}>
                    {member.role}
                  </span>
                </div>
                <p className="text-gray-600 leading-relaxed text-sm">
                  {member.description}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TeamSection;
