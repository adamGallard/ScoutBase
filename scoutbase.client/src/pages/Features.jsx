import styled from 'styled-components';
import {
    PageWrapper,
    Content,
    PageTitle,
	Main,
} from '@/components/common/SharedStyles';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';

const FeaturesSection = styled.section`
  padding: 4rem 2rem;
  background-color: #f9fafb;
  color: #0f172a;
  font-family: sans-serif;
    flex-grow: 1;
   
`;

const FeaturesGrid = styled.div`
  display: grid;
  gap: 2rem;
  margin: 2rem auto;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  max-width: 75rem;
`;

const FeatureCard = styled.div`
  background-color: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s ease;
  border: 1px solid #e5e7eb;

  &:hover {
    transform: translateY(-4px);
  }

  h4 {
    font-size: 1.25rem;
    margin-bottom: 0.5rem;
    color: #0F5BA4;
  }

  p {
    font-size: 0.95rem;
    line-height: 1.5;
    color: #374151;
  }

  .emoji {
    font-size: 1.75rem;
    display: inline-block;
    margin-bottom: 1rem;
  }
`;

export default function Features() {
    const features = [
        {
            emoji: '🕒',
            title: 'Real-time Sign In/Out',
            description: 'Track youth member attendance instantly with accurate timestamps and parent validation.'
        },
        {
            emoji: '📊',
            title: 'CSV & PDF Reports',
            description: 'Export attendance, transitions, and patrol data to CSV or PDF with a single click.'
        },
        {
            emoji: '📱',
            title: 'Mobile-Friendly Interface',
            description: 'Parents can easily sign in/out using any device — no app installation required.'
        },
        {
            emoji: '🧭',
            title: 'Leader Tools',
            description: 'Plan events, monitor patrols, manage sections and transitions all in one place.'
        },
        {
            emoji: '🔐',
            title: 'PIN-Secured Access',
            description: 'Parents securely access youth profiles and attendance history using their 4-digit PIN.'
        },
        {
            emoji: '🛡️',
            title: 'Role-Based Access',
            description: 'Different roles (Admin, Group Leader, Section Leader) get scoped access automatically.'
        },
        {
            emoji: '📬',
            title: 'Contact & Reminder Tools',
            description: 'Keep in touch with families via notices and automate reminders for events and actions.'
        }
    ];

    return (
        <PageWrapper>
            <Header />
            <FeaturesSection>
                <Content>
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem', textAlign: 'center' }}>ScoutBase Features</h1>
                    <FeaturesGrid>
                        
                        {features.map(({ emoji, title, description }) => (
                            <FeatureCard key={title}>
                                <div className="emoji">{emoji}</div>
                                <h4>{title}</h4>
                                <p>{description}</p>
                            </FeatureCard>
                        ))}
                    </FeaturesGrid>
					
                </Content>
                </FeaturesSection>
            <Footer />
        </PageWrapper>
    );
}