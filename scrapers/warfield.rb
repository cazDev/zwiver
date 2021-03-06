require 'rubygems'
require 'mechanize'
require 'time'
require 'zwiver'

class WarfieldScraper 

  def initialize 
    @agent = Mechanize.new { |agent|
      agent.user_agent_alias = 'Mac Safari'
    }
    @venue = 'The Warfield'
    @address = '982 Market St, San Francisco, CA 94102'
  end

  def scrape_all
    @agent.get('http://thewarfieldtheatre.com/events.php') do |page|
      page.links_with( :href => /^eventdetail/).each do |link|
        event_page = link.click
        title = event_page.search('h3').text + ' ' + event_page.search('p.supporting_acts').text
    
        info_items = event_page.search 'div#main div ul li'
        day = info_items[0].text.sub 'Day: ', ''
        time = info_items[1].text.sub 'Showtime: ', ''
        date = Time.parse "#{day} #{time} PDT"
        description = ''
        event_page.search('div.right').each do |tag|
          if tag.name.eql? 'text'
            description += tag.text.strip
          end
        end
        Zwiver::Event.new(
          :title => title,
          :date => date,
          :description => description,
          :address => @address,
          :venue => @venue,
          :url => event_page.uri.to_s
        ).post
      end
    end
  end
end

Zwiver.register __FILE__, '0 0 1 * *' do
  WarfieldScraper.new.scrape_all
end
