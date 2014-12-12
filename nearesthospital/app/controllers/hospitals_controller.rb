class HospitalsController < ApplicationController

  def hospitals
    @request = params[:hospital]
    @client = GooglePlaces::Client.new('secret')
    #@hospitals = @client.spots(46.34301147317693, 15.16968383447963, types: 'hospital', radius: 100000)
    #@hospitals = @client.spots_by_query('Hospital near 46.34301147317693, 15.16968383447963', :types => 'hospital')


    render json: 1
  end
end
